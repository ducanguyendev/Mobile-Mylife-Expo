# Design and UX review

M8 reuses MyLife screen containers, semantic ivory/sage Light/Dark colors, text, cards, fields, buttons, chips, badges, password-visibility controls, toast and preferences. VI/EN keys match. Existing persisted language/theme choices remain available from both USER and ADMIN Profile.

Profile separates identity details, editable fields, avatar, security and preferences. Edit/security/avatar screens support Android Back, discard confirmation, keyboard-aware scrolling, request states, retry and disabled duplicate dispatch. Avatar submit is explicit after preview. Password fields clear on background and route leave.

Admin uses four native tabs. Statistics have accessible information labels. Users/logs use FlatList, bounded render windows, email search and scrollable filters. Long names/emails wrap. Destructive dialogs identify the email and consequences. The log-history limit is visible. No unsupported account-service controls are presented.

Automated checks cover copy parity, existing14 contrast cases, field semantics and route wiring. Android runs use360dp and130% system font. Executed screen coverage and failures are listed in NATIVE_SMOKE_RESULTS. Actual TalkBack traversal/speech, VoiceOver, physical external keyboards and reduced-motion system traversal remain NOT TESTED. Existing theme reduced-motion navigation settings are preserved.

Native testing exposed a Fabric addViewAt failure during Profile success rendering/navigation. M8 applies a narrow form-container/success-navigation adjustment and records replay results in ANDROID_ANR_INVESTIGATION. Accessibility and native stability acceptance must follow observed replay outcomes.
