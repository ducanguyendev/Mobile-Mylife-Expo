# Carry-forward release risks

Overall **NO-GO**. Repository/build/device context in the feature/device/build reports. Severity reflects impact and distinguishes missing proof from an observed exploit.

| ID | Priority | Status / closure evidence |
| --- | --- | --- |
| M9-01 real Drive | P0/Critical | BLOCKED; authorized lifecycle/checksum/reconciliation/cleanup |
| M9-02 Backend remote sync | P0 release gate | Local M8/M9 patches absent from remote; reviewed commit and exact-SHA CI/HTTP |
| M9-03 lost writes/idempotency | P1/High | Observed stale writes accepted; conditional versions/durable idempotency tests |
| M9-04 privacy platforms | P1/High | Android emulator mitigated; physical/iOS snapshot, protected unlock, cache forensics |
| M9-05 FocusEvent ANR | P1/High | OPEN; physical/release main-thread traces and repeated affected flows |
| M9-06 Profile Fabric | P1/High | Inline mitigation; repeated final-release/device save/Back, root cause unproven |
| M9-07 first Map reload | P2/Medium | Separate OPEN defect; original initiating event/PID and release impact |
| M9-08 map production | P1/High | Restricted key/signing/tiles/quota and supported-device proof |
| M9-09 distribution artifact | P1/High | Placeholder ID/test signing/loopback/x86_64 QA only |
| M9-10 device/performance | P1/High | Physical Android/iOS, realistic photos, graph gestures/memory/long sessions |
| M9-11 dependencies | P2/Medium |14 Moderate; compatible patches and native verification |
| M9-12 accessibility | P2/Medium | TalkBack/VoiceOver/keyboard, font traversal; final native busy fix proof |
| M9-13 M9 CI | Release gate | Configured; future exact-M9-SHA success required |
| M9-14 large-data native performance | P1/High | Graph14.17%, Timeline86.55%, calendar82.35%, gallery77.31% sampled frames≤32ms vs90% gate; same-process PSS growth245.45MiB vs150MiB. Trace analysis/physical repeat and narrow remediation required |

Accepted policies are closed product questions: intentional public account avatars and retaining existing sessions after password changes. M8 CI is CLOSED for its SHA. Local passing contracts do not close provider/device/distributed-write gates.

Final-APK busy-label regression is CLOSED for three sampled save/Back cycles; broader accessibility remains open. Final-APK private Recent Apps is MITIGATED with actual black-card proof. Native PUT replay is observed twice for a fixed-state Admin lock; include non-POST side effects in the idempotency review. Final picker opens/cancels but has no selectable synthetic media; final-APK upload/interruption remains NOT TESTED, with historical M8 and HTTP-adapter proof kept distinct.
