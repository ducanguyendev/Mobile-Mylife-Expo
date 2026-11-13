# Anniversary API contract

All routes require USER. Shared route is `/api/family-tree/anniversaries`. GET collection, GET `/{id}`, POST collection, PUT `/{id}`, DELETE `/{id}`, GET `/lunar-to-solar?day&month&year&isLeapMonth`, and GET `/next-occurrence?day&month&isLeapMonth` reuse existing Backend endpoints. Read/create/update/conversion responses use success/data envelopes. Delete204 has no body. Foreign record/member IDs404, invalid input400, ADMIN403 and anonymous401 remain authoritative.

Read DTO fields are id, eventType, title, relatedMemberId, relatedMemberName, relatedMemberGeneration, relatedMemberRole, lunarDay, lunarMonth, isLeapMonth, originalSolarDate, lunarYear, nextLunarYear, nextSolarDate, daysUntil, place, host, notes, createdAt, updatedAt. IDs are safe positive numbers. Member IDs are nullable int32. Original date, lunar fields, linked metadata and nextLunarYear are nullable according to Backend. Next date/countdown and timestamps are required. FAMILY_EVENT nextLunarYear is null, including legacy lunar-backed family records.

Write fields are eventType/title/relatedMemberId/lunarDay/lunarMonth/isLeapMonth/originalSolarDate/lunarYear/place/host/notes. Normal FAMILY_EVENT writes clear lunar fields and use solar original date. Death writes require lunar day1–30/month1–12/year1800–2200, valid original ISO Gregorian date and server conversion equality. Linked deceased member must have matching deathDate. Title trimmed2–200, place500, host300, notes2000.

Conversion DTO echoes lunarDay/lunarMonth/lunarYear/isLeapMonth and returns solarDate. Occurrence DTO echoes lunarDay/lunarMonth/isLeapMonth and returns nextLunarYear, nextSolarDate, daysUntil, solarYear and isCurrentYearPassed. Preview responses must match their request identity. Null dates stay null. Calendar uses nextSolarDate, historical Timeline uses originalSolarDate.

Serialized mutation compares fresh original write fields and updatedAt before edit/delete, then verifies the authoritative saved record/list or deletion absence. GET followed by PUT/DELETE remains nontransactional. A dispatched uncertain write requires reconciliation before another mutation.
