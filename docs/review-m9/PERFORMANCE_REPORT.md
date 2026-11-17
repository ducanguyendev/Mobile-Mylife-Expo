# Performance protocol and results

Budgets below are declared before the M9 large-data measurements. They are local QA gates, not established product SLAs. Device/build identity and actual samples must accompany the results. Emulator observations cannot establish physical-device FPS or capacity.

| Measurement | Provisional QA budget | Conditions |
| --- | --- | --- |
| Loopback API read p95 | ≤1000ms normal,≤2000ms large aggregate | Warm server,20 sequential samples per endpoint; include payload size |
|100-member graph layout CPU p95 | ≤50ms | JS source layout only,30 warmed samples; no gesture/FPS claim |
| Embedded release-variant first meaningful screen | Cold≤10s, warm≤3s | Exclude installation; actual Home/Admin/login readiness rather than activity timing alone |
| App PSS | ≤400MiB normal,≤600MiB large; growth≤150MiB | Same emulator and stable screen; full private photo decoding included where possible |
| Scroll frames | ≥90% within32ms | Native frame statistics on fixed scripted gesture; label emulator-only |
| Photo batch | All20 supported files acknowledged or explicit uncertainty/error | Synthetic1536×2048 PNGs; record bytes, elapsed and storage-adapter limitation |

Dataset target:100 family members across five recorded generations,500 custom Timeline events,100 anniversaries and100 private synthetic photos. Seed through real authenticated endpoints. Keep synthetic credentials in ignored temporary files. Document any smaller executed dataset rather than relabeling it.

No production provider or family data is used. In-process HTTP storage adapters validate app/server behavior but exclude actual Google latency, rate limits and persistence. A compressible synthetic pattern exercises decoded dimensions without representing worst-case5MiB photographic files. Full-size gallery design, missing thumbnails/pagination and native Blob/base64 copies remain architectural risks until measured on physical devices and realistic size distributions.

Native compilation and API measurements must be separated when host pressure makes results unreliable. Record failed setup/build attempts separately. Final samples and outcomes are added after execution under test-results/performance and native evidence. No measurements are assumed from M8 or invented from static code inspection.

## Executed 17 November

Recreated the dropped native dataset through real endpoints:100 members/five generations,20 manual locations,500 custom Timeline events,100 anniversaries and120 private synthetic PNGs after the measured20-file batch. Each PNG1536×2048,552,521bytes. `node scripts/m9-performance.cjs seed` and `measure` both exit0. Evidence: `test-results/performance/dataset.json`, `api-and-layout.json`, `members-synthetic.json`.

| Measurement | Samples | p95 / result | Budget |
| --- | --- | --- | --- |
| Family API |20 |60.19ms |2000ms |
| Map API |20 |19.68ms |2000ms |
| Timeline API |20 |36.42ms |2000ms |
| Anniversaries API |20 |21.34ms |2000ms |
| Library overview |20 |19.95ms |2000ms |
|100-node host JS graph layout |30 warmed |1.33ms |50ms |
|20-file upload |1 |11,050,420bytes /557.19ms /20 acknowledged | All20 acknowledged |

These are loopback/API and host-Node measurements, not Android FPS or real Google latency. Native release observations are stored separately in `test-results/performance/native-memory-frames.json` and `startup.json` when executed. The Android graph uses viewport culling; rendered private-image dimensions/decoder behavior can differ from source file dimensions. A compressible pattern does not establish worst-case photographic capacity. Physical devices and realistic size distributions remain open release work.

## Final native release results

`node scripts/m9-release-regression.cjs performance 1200` and `startup 1300` exit0: measurements were collected successfully, **not all budgets passed**. Final APK `eda698362b3e082c4215e252239338002d2484dcade3792b122f5337ae91f957`, API35 x86_64/WHPX/SwiftShader,720×1280,density320,font1.3. Ten scripted up/down swipes per screen; Android HWUI framestats retain119–120 valid sampled frames. This is not a complete JS/GL FPS measurement or physical-device result.

| Screen | PSS point sample, MiB | Frames ≤32ms |90% budget |
| --- | --- | --- | --- |
| Home |138.72 |96.64% of119 | PASS |
|100-member tree |152.30 |14.17% of120 | FAIL |
| Map fallback |245.27 |78.15% of119 | FAIL; actual tiles unverified |
|500-event Timeline |253.06 |86.55% of119 | FAIL |
|100-anniversary calendar |276.69 |82.35% of119 | FAIL |
|120-photo gallery |384.17 |77.31% of119 | FAIL |
| Private photo lightbox |357.93 | Not measured | Actual ImageView observed |

Absolute samples remain below600MiB, but same-process peak growth245.45MiB exceeds the150MiB provisional growth gate. These are ordered point samples across retained routes; this does not diagnose a memory leak or establish worst-case peak/physical capacity. Record this as HIGH/OPEN performance work. Graph raw gfxinfo reports50th/95th percentiles48/85ms, high-input-latency159 and slow-UI-thread81 events. Main-thread/render/retention attribution needs trace analysis and repeat physical/release profiling before selecting a narrow fix.

Cold meaningful-Home upper bounds4503/4289/4757ms satisfy10s. Warm bounds3377/3332/3377ms exceed3s, but include uiautomator observation overhead; actual warm rendering time is not isolated, so the3s gate is UNPROVEN rather than a claimed app-startup failure. Device boot, installation and Metro are excluded. No development startup result is relabeled as release performance.

Evidence: `performance/native-memory-frames.json`, `startup.json`; raw `native/memory-*.txt`, `frames-*.txt`,1200–1210/1300–1305 XML. Reproduction commands are in the scripts. A task-local Perfetto graph trace is attempted separately; its collection/analysis status is in `performance/graph-trace.json` or its failure record.

Perfetto collection succeeds on retry: `node scripts/m9-trace-graph.cjs`, exit0,12s/six pan gestures,6,128,104bytes. Process18043 is unchanged during the trace. File `performance/graph-release.perfetto-trace` is scanned against actual temporary passwords/JWT patterns before retention. The first output under `/data/local/tmp` failed permission; the successful attempt uses the documented `/data/misc/perfetto-traces` directory and removes its unique device file after copying. This is collected system/main-thread/render evidence, **not completed root-cause analysis**. Analyze locally before selecting an optimization; no trace is uploaded. [Official Perfetto CLI](https://perfetto.dev/docs/reference/perfetto-cli) documents the recording options.
