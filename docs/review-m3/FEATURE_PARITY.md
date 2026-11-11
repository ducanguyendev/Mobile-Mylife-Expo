# Family feature parity — M3

Reference: Web `144fc506c0ec7957d40a137351aeda296b8937b5`, Backend `c1b43b1f83e17f9546edc9bb314b8345b8d947ad`. Expo started clean at `8b1a0b6b0e3cd2e9562240387202e74494d01e4e`, branch `feature_minhduc`.

| Capability | M2 baseline | M3 result | Evidence / boundary |
| --- | --- | --- | --- |
| Family directory | One simple list | PASS: virtualized cards/list, accent-insensitive search, generation/life/gender filters, refresh/retry | 112-member Android family; 150-member search regression |
| Profile | Basic member GET | PASS: actual aggregate, relatives, contact/bio, birth/death, supplied event summaries | Real `/profile`; native related-member navigation |
| CRUD | Basic form | PASS: complete scalar fields, fresh-read merge, conflict handling, explicit delete | Native create/edit/delete plus isolated API parity |
| Relationship selector | Alert limited to eight | PASS: full-screen searchable FlatList, draft/cancel/confirm/clear confirmation | Native 111 candidates, missing-selection/unit regressions |
| Relationships | Limited parent/spouse/children | PASS: explicit sibling/cousin/custom types; separately labelled inferred shared-parent siblings | Reciprocal Backend assertions; preservation tests |
| Avatar | Missing | PARTIAL PASS: pick/preview/File multipart/view/replace/remove/private image/error/retry | Android + real Backend; test-only storage adapter, real Drive NOT TESTED |
| Graph | Placeholder | PARTIAL PASS: recorded generations, actual directed parent edges, distinct spouse/horizontal, native pan/buttons/fit/tap, pinch controller | Native pan/zoom; two-finger physical gesture NOT TESTED |
| Localization/theme | Family Vietnamese only | PASS for new app-owned VI/EN copy, existing persistent light/dark | Backend/user-provided generation titles and event text are retained as data |
| Accessibility/platform coverage | M2 foundations | PARTIAL PASS: scaling, labelled native controls, list alternative | No full TalkBack audit; iOS and physical devices NOT TESTED |

No map, full timeline, anniversaries, library or unrelated M8 workflows were implemented. No WebView. Web and Backend source remain unchanged; Flutter is read-only.
