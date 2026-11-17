# Post-M9 remediation plan

1. Backend owner: review preserved M8 and narrow M9 patches/tests; separately authorize commit/push. Verify remote exact SHA and run Backend217, Expo427 and HTTP175. Deployment identity requires separate proof.
2. Storage operator: supply an explicitly authorized disposable Drive deployment/folder; test real avatar/Library lifecycle, checksums, failure compensation/orphans and verified cleanup. Retain sanitized evidence.
3. Backend/Web/mobile: design compatible conditional versions and durable idempotency, binding actor/resource/version/payload. Define409/412/recovery and test overlapping stale clients/process death. Avoid incomplete mandatory-header migration.
4. Mobile QA: final signed candidates on physical Android/iOS; snapshot/lock/account switch, picker formats, first Map, repeated Profile save/Back, realistic galleries/memory/main-thread traces. Keep ANR/Map/Fabric separate.
5. Release owner: finalize owned package/domain/version/signing/API, supported ABIs, restricted map key/quota, crash/source-map handling. Remove QA loopback/test-signing configuration from distribution.
6. Mobile/security: apply compatible dependency patches and rebuild/regress; execute TalkBack/VoiceOver/keyboard/large-font coverage.
7. Release owner: reconcile exact commit/build/device evidence with checklist and reissue GO only when critical gates close.

Measured performance follow-up (M9-14/HIGH): analyze the collected graph trace, separate UI-thread/JS/SVG/GPU/route-retention costs, repeat fixed gestures on physical hardware and profile realistic photos. Graph14.17% within32ms is below the90% provisional gate; gallery growth245.45MiB exceeds150MiB. Implement only evidence-backed changes, rebuild and rerun the same dataset/gesture protocol. Investigate warm startup with instrumentation finer than hierarchy polling before attributing its3.3s upper bound to rendering.

See [CARRY_FORWARD_RISKS.md](CARRY_FORWARD_RISKS.md) for priorities. No external account work or publishing was performed automatically.
