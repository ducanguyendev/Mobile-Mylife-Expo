# End-to-end test results

Repository/environment: [FULL_FEATURE_MATRIX.md](FULL_FEATURE_MATRIX.md). Commands from Expo root on Windows/Node24/.NET10/PostgreSQL18. HTTP uses actual Kestrel/PostgreSQL; native/storage adapters are explicit.

| Command | Result | Evidence |
| --- | --- | --- |
| `node scripts/run-m9-quality.cjs` | All13 commands exit0;427 unique JS +14 contrast | final-quality.json, final-*.log |
| `PG_BIN=… node scripts/run-m9-backend.cjs` |217 Backend PASS,0 failed/skipped | backend-suite/full-backend-tests.log; backend-unit/backend-full-isolated.trx |
| Same with `--profile-admin` |18 PASS, subset of217 | targeted/ |
| `PG_BIN=… node scripts/run-isolated-m9.cjs` |175 HTTP scenario groups PASS; all stages0 and cleanup true | final-http/final-lifecycle.json and suite JSON |
|17-Nov `npm audit` all/runtime |14/9 Moderate;0 High/Critical, exits1 | npm-audit-all/runtime.json |
| Android Gradle release | Exit0; final rebuild2m10s | native/build-resume.json |

Unique JS counts: foundation26 (auth10 is included), M2=22,M3=28,M4=39,M5=60,M6=83,M7=88,M8=61,M9=20. Total427; contrast14 separate. HTTP: final-integration7,m2-home6,m3=12,m4=17,m5=21,m6=21,m7=21,m8=29,m9=41 =175. Do not count targeted Backend cases again.

M9's41 groups separately cover24 USER steps,10 ADMIN steps and security/concurrency characterization. Registration/session restore, profile/avatar, member/relationship/map, Timeline/derived dates, anniversary/lunar/Home, category/album/photo bytes/metadata/delete, logout/switch and Admin role/lock/delete all assert authoritative Backend state. See every named check in `final-http/m9-integration.json`. Storage adapter/native bridge tests are not real Google Drive or browser UI.

Resumption corrected a pause-file error: final foundation had failed to load the new privacy dependency. Its route-only harness now receives an explicit privacy adapter, preserving guard assertions. Separate M9 tests exercise actual privacy sequencing. All quality commands now pass. The later explicit busy=false fix requires another final quality pass and native build replay.

M8 GitHub run43824725574 succeeded for exact SHA1e64130e (`github-evidence.json`). M9 CI NOT RUN: no M9 commit/push is authorized. Configured quality/security/manual Backend workflows do not establish remote success. Backend integration preflights required patch presence and uses no provider secret.

Native execution and failures are separately recorded in the device matrix and native JSON/XML; passing limitation characterization is not closure of a release risk.

Final17-Nov quality replay after explicit busy=false: all13 commands exit0. Full Backend217 also reruns17-Nov,217 passed/0 skipped/failed in59s; isolated DB dropped/PostgreSQL stopped. HTTP175 evidence is the completed16-Nov final run;17-Nov introduces no Backend contract change and preserves that evidence rather than pretending it was rerun. Native scenarios execute17-Nov against a separately recreated real Backend runtime.

Native command/results (each successful command exits0): `m9-release-regression.cjs` profile550 (three saves; initial success-message observation corrected with591–593 and authoritative login), roles900, admin1000, faults720, write-lifecycle780, performance1200, startup1300; `m9-native.cjs uncertainty`200–212. `release-profile.json` records the independently confirmed password result. Performance collection succeeds but frame/growth budgets fail as detailed in PERFORMANCE_REPORT. Native byte-upload on final APK remains explicitly NOT TESTED.

Exact Profile command disposition: profile550 exits1 because the saved-password success text was above the viewport. Three save/Back assertions had passed. Separate591–593 native observations and a fresh new-password login confirm successful password persistence and all3 empty fields; the recorded failure is classified as harness observation and retained. The helper now scrolls to the feedback. A later whole-command Profile exit0 is **not** claimed.
