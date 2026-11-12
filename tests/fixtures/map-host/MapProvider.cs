using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using MyLife.Features.FamilyTree.Services;
using System.Net;
using System.Text;

[assembly: HostingStartup(typeof(M4MapContractStartup))]
// Only the disposable M4 process opts in; no public geocoder or personal data.
public sealed class M4MapContractStartup : IHostingStartup
{
    public void Configure(IWebHostBuilder builder) => builder.ConfigureServices(services =>
    {
        if (Environment.GetEnvironmentVariable("MYLIFE_M3_CONTRACT_PROVIDER") != "1") throw new InvalidOperationException("Disposable contract runtime required");
        services.AddHttpClient<NominatimGeocodingService>().ConfigurePrimaryHttpMessageHandler(() => new ControlledGeocoder());
        services.AddHostedService<MapTestControl>();
    });
}
public static class MapFiles
{
    public static string Root => Path.GetDirectoryName(Environment.GetEnvironmentVariable("MYLIFE_M3_PROVIDER_CONTROL"))!;
    public static string FileName(string name) => Path.Combine(Root, "m4-geocoder-" + name);
}
public sealed class MapTestControl(IOptions<GeocodingOptions> options) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            if (File.Exists(MapFiles.FileName("enable"))) { options.Value.Enabled = true; File.WriteAllText(MapFiles.FileName("enabled"), "synthetic-only"); }
            await Task.Delay(50, ct);
        }
    }
}
public sealed class ControlledGeocoder : HttpMessageHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        var uri = request.RequestUri!;
        if (uri.Host != "nominatim.openstreetmap.org" || uri.AbsolutePath != "/search") throw new InvalidOperationException("Unexpected test destination");
        var address = WebUtility.UrlDecode(uri.Query.TrimStart('?').Split('&').Single(x => x.StartsWith("q="))[2..]);
        // The client deliberately saves a newer manual pin while this call is held.
        if (address == "M4 synthetic delayed address")
        {
            File.WriteAllText(MapFiles.FileName("started"), "synthetic-only");
            while (!File.Exists(MapFiles.FileName("release"))) await Task.Delay(25, ct);
            File.WriteAllText(MapFiles.FileName("returned"), "synthetic-only");
            return Json("[{\"lat\":\"1\",\"lon\":\"2\",\"display_name\":\"Synthetic delayed automatic result\"}]");
        }
        return Json(address.Contains("M4 synthetic success") ? "[{\"lat\":\"10\",\"lon\":\"106\",\"display_name\":\"Synthetic automatic result\"}]" : "[]");
    }
    private static HttpResponseMessage Json(string json) => new(HttpStatusCode.OK) { Content = new StringContent(json, Encoding.UTF8, "application/json") };
}
