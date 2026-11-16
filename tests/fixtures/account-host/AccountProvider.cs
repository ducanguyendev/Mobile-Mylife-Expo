using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
[assembly: HostingStartup(typeof(M8AccountStartup))]
public sealed class M8AccountStartup : IHostingStartup
{
    public void Configure(IWebHostBuilder builder) => builder.ConfigureServices(services =>
    {
        if (Environment.GetEnvironmentVariable("MYLIFE_M3_CONTRACT_PROVIDER") != "1") throw new InvalidOperationException("Disposable adapter only");
        services.AddHttpClient("GoogleDriveAvatarService").ConfigurePrimaryHttpMessageHandler(provider => new M8AccountAdapter(provider.GetRequiredService<ContractAvatarStore>()));
    });
}
public sealed class M8AccountAdapter(ContractAvatarStore store) : HttpMessageHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        if (request.RequestUri?.AbsoluteUri != "http://m3-avatar-contract.invalid/provider") throw new HttpRequestException("External network blocked in M8 adapter");
        using var doc = JsonDocument.Parse(await request.Content!.ReadAsStringAsync(ct));
        var root = doc.RootElement;
        var action = root.GetProperty("action").GetString();
        if (action == "upload")
        {
            var bytes = Convert.FromBase64String(root.GetProperty("fileBase64").GetString()!);
            var mime = root.GetProperty("contentType").GetString();
            var id = root.TryGetProperty("existingFileId", out var old) && old.ValueKind == JsonValueKind.String ? old.GetString()! : "m8_account_" + Guid.NewGuid().ToString("N");
            store.Trace("account_upload", id, 0, bytes.Length);
            if (store.Flag("accountFailUpload")) return Json(new { success = false });
            store.Assets[id] = new(bytes, mime!, 0);
            return Json(new { success = true, fileId = id, contentType = mime, md5Checksum = Convert.ToHexString(MD5.HashData(bytes)) });
        }
        if (action == "delete")
        {
            var id = root.TryGetProperty("fileId", out var file) && file.ValueKind == JsonValueKind.String ? file.GetString() : null;
            store.Trace("account_delete", id, 0);
            if (store.Flag("accountFailDelete")) return Json(new { success = false });
            if (id is not null) store.Assets.TryRemove(id, out _);
            return Json(new { success = true, deleted = true });
        }
        throw new HttpRequestException("Unexpected account provider action");
    }
    private static HttpResponseMessage Json(object value) => new(HttpStatusCode.OK) { Content = new StringContent(JsonSerializer.Serialize(value), Encoding.UTF8, "application/json") };
}
