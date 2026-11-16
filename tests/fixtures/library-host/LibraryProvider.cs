using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using System.Collections.Concurrent;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
[assembly: HostingStartup(typeof(M7LibraryStartup))]
public sealed class M7LibraryStartup : IHostingStartup
{
    public void Configure(IWebHostBuilder builder) => builder.ConfigureServices(services => {
        if (Environment.GetEnvironmentVariable("MYLIFE_M3_CONTRACT_PROVIDER") != "1") throw new InvalidOperationException("Disposable adapter only");
        services.AddSingleton<LibraryAdapterStore>();
        services.AddHttpClient("GoogleDriveLibraryStorageService").ConfigurePrimaryHttpMessageHandler(p => new LibraryAdapter(p.GetRequiredService<LibraryAdapterStore>(), p.GetRequiredService<ContractAvatarStore>()));
    });
}
public sealed class LibraryAdapterStore
{
    public record Asset(byte[] Bytes, string Mime, string Folder);
    public ConcurrentDictionary<string, byte> Folders { get; } = new();
    public ConcurrentDictionary<string, Asset> Files { get; } = new();
}
public sealed class LibraryAdapter(LibraryAdapterStore store, ContractAvatarStore control) : HttpMessageHandler
{
    private static HttpResponseMessage Json(object value) => new(HttpStatusCode.OK) { Content = new StringContent(JsonSerializer.Serialize(value), Encoding.UTF8, "application/json") };
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        if (request.RequestUri?.AbsoluteUri != "http://m3-avatar-contract.invalid/provider") throw new HttpRequestException("No external network permitted in M7 adapter");
        using var doc = JsonDocument.Parse(await request.Content!.ReadAsStringAsync(ct)); var root = doc.RootElement;
        var action = root.GetProperty("action").GetString();
        control.Trace(action!, null, 0, store.Files.Count);
        var folder = root.TryGetProperty("folderId", out var f) ? f.GetString()! : "";
        var fileId = root.TryGetProperty("fileId", out var i) ? i.GetString()! : "";
        if (action == "library_create_album_folder") {
            var id = "m7_folder_" + Guid.NewGuid().ToString("N"); store.Folders[id] = 0;
            return Json(new { success = true, folderId = id, folderName = "album_" + root.GetProperty("albumId").GetString() });
        }
        if (!store.Folders.ContainsKey(folder)) return Json(new { success = false });
        if (action == "library_upload_photo") {
            var id = "m7_photo_" + Guid.NewGuid().ToString("N"); var bytes = Convert.FromBase64String(root.GetProperty("fileBase64").GetString()!); var mime = root.GetProperty("contentType").GetString()!;
            store.Files[id] = new(bytes, mime, folder);
            return Json(new { success = true, fileId = id, contentType = mime, fileSize = bytes.LongLength, md5Checksum = control.Flag("libraryBadChecksum") ? "bad" : Convert.ToHexString(MD5.HashData(bytes)) });
        }
        if (action == "library_read_photo" && store.Files.TryGetValue(fileId, out var asset) && asset.Folder == folder) {
            if (control.Flag("libraryFailRead")) return Json(new { success = false });
            return Json(new { success = true, fileId, contentType = asset.Mime, fileSize = asset.Bytes.LongLength, md5Checksum = Convert.ToHexString(MD5.HashData(asset.Bytes)), fileBase64 = Convert.ToBase64String(asset.Bytes) });
        }
        if (action == "library_delete_photo") {
            if (control.Flag("libraryFailDelete")) return Json(new { success = false, deleted = false });
            if (store.Files.TryGetValue(fileId, out var asset2) && asset2.Folder == folder) store.Files.TryRemove(fileId, out _);
            return Json(new { success = true, deleted = true });
        }
        if (action == "library_delete_album") {
            if (control.Flag("libraryFailDelete")) return Json(new { success = false, deleted = false });
            foreach (var entry in store.Files.Where(x => x.Value.Folder == folder)) store.Files.TryRemove(entry.Key, out _);
            store.Folders.TryRemove(folder, out _); return Json(new { success = true, deleted = true });
        }
        return Json(new { success = false });
    }
}
