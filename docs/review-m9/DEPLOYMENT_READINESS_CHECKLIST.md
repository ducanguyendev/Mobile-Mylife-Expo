# Deployment readiness checklist

| Gate | State | Required evidence |
| --- | --- | --- |
| Local Expo quality | PASS covered |427 unique JS +14 contrast; final-quality.json |
| Local Backend/HTTP | PASS covered |217/175; isolated lifecycle exit0 |
| Backend GitHub sync | OPEN | Reviewed M8/M9 remote commit |
| M9 exact-SHA CI | NOT RUN | Future pushed-SHA success |
| Real Drive | BLOCKED | Authorized lifecycle/reconciliation/cleanup |
| Conditional writes/idempotency | OPEN | Compatible protocol and cross-client/restart tests |
| Emulator Recent Apps | MITIGATED tested build | Snapshot proof + final artifact scope |
| Physical/iOS privacy/stability | NOT TESTED | Supported-device/lock/cache/native matrix |
| Android internal release | Build PASS; partial QA | Final artifact identity and native scope |
| Store package/signing/API | OPEN | Owned ID, production TLS/config/signing, ABIs |
| Real map tiles/key | BLOCKED | Restricted key/tiles/quota/signing |
| Dependencies | OPEN/Medium |14 Moderate remediation or reviewed disposition |
| Accessibility | PARTIAL | TalkBack/VoiceOver/keyboard/device proof |
| Native large-data budgets | FAIL / physical unproven | Graph/Timeline/calendar/gallery frames and245.45MiB growth need diagnosis/remediation; finer warm-start observation |
| QA cleanup | PASS for owned resumed runtime | cleanup.json: DB dropped; API/PG/proxy/emulator/private ADB ports closed; QA app data/credential JSON removed; actual credential scan0 findings |
| Publication authorization | NOT GIVEN | Separate explicit approval |

Current release decision **NO-GO**. Do not automatically execute EAS/store submission/deployment from this checklist.
