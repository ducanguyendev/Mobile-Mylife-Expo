# Admin API parity

| Native screen/action | Backend | Validation and feedback |
| --- | --- | --- |
| Overview | GET /api/admin/stats | Six nonnegative safe-integer counts, active+locked total, retry and pull-refresh |
| Users | GET /api/admin/users | Unique valid account IDs, email/role/status filters, four sorts, virtualized rows |
| Details | Existing user DTO | Email, display/original name, ID, role, status, provider, created/updated timestamps |
| Role | PUT /api/admin/users/{id}/role | USER/ADMIN, fresh actor and target, identifying confirmation |
| Lock/unlock | PUT /api/admin/users/{id}/status | Boolean isActive, confirmation, Admin protection |
| Delete | DELETE /api/admin/users/{id} | Identifying email, permanent consequence, Admin/self protection, family409 |
| Logs | GET /api/admin/logs | Valid IDs/timestamps, SUCCESS/FAILED/REGISTERED vocabulary, email/status/time controls |

Statistics come from Backend. Distribution displays active/locked counts against total, including zero. The log screen explicitly labels the supplied recent collection of up to50 records. The current Backend writes SUCCESS and FAILED. REGISTERED is retained as a compatible Web filter value and creates no synthetic records.

Native Admin uses Overview, Users, Login logs and Profile tabs. Shared VI/EN, theme and settings components follow the existing design system. API responses are read back after mutations. Web W10 supplies business semantics and client filter/sort behavior. Backend remains final authority for every administrative operation.
