# Vietnamese lunar calendar audit

VietnameseLunarCalendarService supplies conversion, next occurrence and the current-solar-year-passed flag in Vietnam UTC+7. Expo sends lunar day/month/year/leap state to the existing endpoints. Historical lunar year is explicitly entered and supports1800–2200. Can Chi follows Web stem(year+6)%10 and branch(year+8)%12 only for a validated explicit lunar year.

The actual conversion fixtures passed through Kestrel and PostgreSQL. Lunar1/1/2024 converts to2024-02-10,1/1/2025 to2025-01-29, leap1/2/2023 to2023-03-22 and30/2/2024 to2024-04-08. Day30 of lunar month1/2024 and leap month2/2024 return400. Boundary years1800/2200 convert,1799/2201 return400. Local bounds also reject invalid requests before transport.

Frozen business time2024-02-10 includes Tết with daysUntil0. The following Vietnam day returns2025-01-29 with353 days and isCurrentYearPassed true. Leap month recurrence skips years lacking that leap month, then its returned date matches conversion for the returned nextLunarYear. December2026 correctly selects2027-02-06 for the next Tết. UTC16:59:59 versus17:00 at the Gregorian year boundary is covered in new Backend tests and JS business-date checks.

FAMILY_EVENT follows Backend solar recurrence. February29 uses February28 in non-leap years. Frozen cases cover leap-day today, February27, March1 and December31. Its nullable nextLunarYear stays null. Original solar date remains unchanged while upcoming date advances. Historical source-qualified Timeline rows retain original dates.

The form debounces350ms and clears preview output immediately on draft identity changes. AbortSignal plus request identity denies late conversion/occurrence results. Save requires a current successful conversion matching the original date, a current next-occurrence preview and valid related member context. Mutation preflight repeats conversion before dispatch. Backend still validates the final write.

Full Backend203 includes the original lunar suite and9 new deterministic date cases. M6 real HTTP21 scenario groups use a disposable clock injected at the final .NET host-build boundary. Earlier attempts exposed Windows nested-path escaping and an early HostingStartup registration overwritten by Program. These test-harness corrections are retained with failed-attempt logs. Production Backend code has no clock-control setting.

[.NET host build source](https://github.com/dotnet/runtime/blob/main/src/libraries/Microsoft.Extensions.Hosting/src/HostApplicationBuilder.cs).
