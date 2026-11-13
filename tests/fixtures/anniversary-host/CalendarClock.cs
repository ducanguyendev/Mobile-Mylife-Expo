using System.Text.Json;
using System.Diagnostics;
using System.Runtime.CompilerServices;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

// Observe the final host-build boundary, after Program registers TimeProvider.System.
// The earlier HostingStartup service callback is overwritten by that registration.
public sealed class M6CalendarContractStartup : IObserver<DiagnosticListener>, IObserver<KeyValuePair<string, object?>>
{
    private static readonly List<IDisposable> subscriptions = [];

    [ModuleInitializer]
    public static void Initialize()
    {
        if (Environment.GetEnvironmentVariable("MYLIFE_M3_CONTRACT_PROVIDER") != "1"
            || string.IsNullOrEmpty(Environment.GetEnvironmentVariable("MYLIFE_M6_CLOCK_FILE")))
            throw new InvalidOperationException("Disposable M6 contract runtime required");
        subscriptions.Add(DiagnosticListener.AllListeners.Subscribe(new M6CalendarContractStartup()));
    }

    public void OnNext(DiagnosticListener listener)
    {
        if (listener.Name == "Microsoft.Extensions.Hosting") subscriptions.Add(listener.Subscribe(this));
    }

    public void OnNext(KeyValuePair<string, object?> value)
    {
        if (value.Key != "HostBuilding") return;
        if (value.Value is IHostBuilder builder) builder.ConfigureServices((_, services) => ReplaceClock(services));
        else if (value.Value is IHostApplicationBuilder application) ReplaceClock(application.Services);
        else throw new InvalidOperationException("Review .NET host diagnostic contract");
    }

    private static void ReplaceClock(IServiceCollection services)
    {
        services.RemoveAll<TimeProvider>();
        services.AddSingleton<TimeProvider, M6CalendarClock>();
        Console.WriteLine("M6 disposable clock registered at final host build");
    }

    public void OnCompleted() { }
    public void OnError(Exception error) => throw new InvalidOperationException("M6 host diagnostics failed", error);
}

public sealed class M6CalendarClock : TimeProvider
{
    public override DateTimeOffset GetUtcNow()
    {
        var file = Environment.GetEnvironmentVariable("MYLIFE_M6_CLOCK_FILE");
        if (string.IsNullOrEmpty(file)) throw new InvalidOperationException("M6 test clock control required");
        using var json = JsonDocument.Parse(File.ReadAllText(file));
        if (json.RootElement.TryGetProperty("utcNow", out var value)) return value.GetDateTimeOffset();
        return TimeProvider.System.GetUtcNow();
    }
}
