using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Headers;
using System.Reflection;
using System.Runtime.Loader;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;

[assembly: HostingStartup(typeof(M3AvatarContractStartup))]

// Loaded only by the Expo disposable harness, never by Backend production config.
internal class StartupHook
{
    public static void Initialize()
    {
        if (Environment.GetEnvironmentVariable("MYLIFE_M3_CONTRACT_PROVIDER") != "1") throw new InvalidOperationException("M3 test-only host requires explicit opt-in");
        var assembly = Assembly.GetExecutingAssembly();
        AssemblyLoadContext.Default.Resolving += (_, name) => name.Name == assembly.GetName().Name ? assembly : null;
    }
}
public sealed class M3AvatarContractStartup : IHostingStartup
{
    public void Configure(IWebHostBuilder builder) => builder.ConfigureServices(services =>
    {
        if (Environment.GetEnvironmentVariable("MYLIFE_M3_CONTRACT_PROVIDER") != "1") throw new InvalidOperationException("M3 test-only provider");
        services.AddSingleton<ContractAvatarStore>();
        services.AddHttpClient("GoogleDriveMemberAvatarService").ConfigurePrimaryHttpMessageHandler(provider => new ContractAvatarHandler(provider.GetRequiredService<ContractAvatarStore>()));
    });
}
public sealed class ContractAvatarStore
{
    public sealed record Asset(byte[] Bytes, string Mime, int MemberId);
    public ConcurrentDictionary<string, Asset> Assets { get; } = new();
    private readonly object traceLock = new();
    public bool Flag(string name)
    {
        var file = Environment.GetEnvironmentVariable("MYLIFE_M3_PROVIDER_CONTROL");
        if (string.IsNullOrEmpty(file) || !File.Exists(file)) return false;
        using var document = JsonDocument.Parse(File.ReadAllText(file));
        return document.RootElement.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.True;
    }
    public void Trace(string action, string? id, int memberId, int bytes = 0)
    {
        var path = Environment.GetEnvironmentVariable("MYLIFE_M3_PROVIDER_TRACE");
        if (!string.IsNullOrWhiteSpace(path)) lock (traceLock) File.AppendAllText(path, JsonSerializer.Serialize(new { action, id, memberId, bytes, provider = "in-process HTTP contract adapter; NOT Google Drive" }) + "\n");
    }
}
public sealed class ContractAvatarHandler(ContractAvatarStore store) : HttpMessageHandler
{
    private static HttpResponseMessage Json(object value, HttpStatusCode status = HttpStatusCode.OK) => new(status) { Content = new StringContent(JsonSerializer.Serialize(value), Encoding.UTF8, "application/json") };
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var uri = request.RequestUri ?? throw new HttpRequestException("Missing test URI");
        if (request.Method == HttpMethod.Post && uri.AbsoluteUri == "http://m3-avatar-contract.invalid/provider")
        {
            using var document = JsonDocument.Parse(await request.Content!.ReadAsStringAsync(cancellationToken));
            var root = document.RootElement; var action = root.GetProperty("action").GetString(); var memberId = root.GetProperty("memberId").GetInt32();
            if (action == "member_avatar_upload")
            {
                var existing = root.TryGetProperty("existingFileId", out var old) && old.ValueKind == JsonValueKind.String ? old.GetString() : null;
                var id = existing ?? "m3_contract_" + Guid.NewGuid().ToString("N");
                var bytes = Convert.FromBase64String(root.GetProperty("fileBase64").GetString()!); var mime = root.GetProperty("contentType").GetString()!;
                store.Trace("upload", id, memberId, bytes.Length);
                if (store.Flag("failUpload")) return Json(new { success = false }, HttpStatusCode.ServiceUnavailable);
                store.Assets[id] = new(bytes, mime, memberId);
                return Json(new { success = true, fileId = id, contentType = mime, fileSize = bytes.LongLength, md5Checksum = store.Flag("badChecksum") ? "invalid" : Convert.ToHexString(MD5.HashData(bytes)) });
            }
            if (action == "member_avatar_delete")
            {
                var id = root.TryGetProperty("fileId", out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
                store.Trace("delete", id, memberId);
                if (store.Flag("failDelete")) return Json(new { success = false }, HttpStatusCode.ServiceUnavailable);
                if (id is not null && store.Assets.TryGetValue(id, out var found) && found.MemberId == memberId) store.Assets.TryRemove(id, out _);
                return Json(new { success = true, deleted = true });
            }
        }
        if (request.Method == HttpMethod.Get && uri.Scheme == "https" && uri.Host == "lh3.googleusercontent.com" && uri.AbsolutePath.StartsWith("/d/"))
        {
            var id = Uri.UnescapeDataString(uri.AbsolutePath[3..]);
            if (!store.Assets.TryGetValue(id, out var asset)) return new(HttpStatusCode.NotFound);
            store.Trace("image", id, asset.MemberId, asset.Bytes.Length);
            if (store.Flag("failImage")) return new(HttpStatusCode.ServiceUnavailable);
            var result = new HttpResponseMessage(HttpStatusCode.OK) { Content = new ByteArrayContent(asset.Bytes) };
            result.Content.Headers.ContentType = new MediaTypeHeaderValue(asset.Mime);
            result.Content.Headers.ContentLength = asset.Bytes.LongLength;
            return result;
        }
        // No fallback network transport: this fixture cannot access Google or production.
        throw new HttpRequestException("Unexpected request blocked by the M3 contract adapter");
    }
}
