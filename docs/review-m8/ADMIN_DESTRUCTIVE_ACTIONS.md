# Administrative destructive actions

Role, lock/unlock and delete operations require an identifying-email confirmation. Role changes warn about revoked sessions. Locking warns about interrupted access. Deletion warns about permanence and family-record protection. Current-account actions are blocked in Expo, following Web semantics. Administrator lock/delete controls are unavailable.

The service rechecks current actor and freshly fetched target before writing. A changed updatedAt, role or status requires another review. A per-session/account write gate prevents simultaneous dispatch and retains uncertainty across route reopening. Network/server failures never display confirmed deletion. Authoritative users and statistics are refetched. Manual reload reconciles an uncertain result before another action. Backend USER_HAS_FAMILY_MEMBERS409 receives specific localized feedback. No automatic family cascade is attempted.

Backend serializes last-active-admin demotions through its existing advisory transaction lock. M8 extends that same lock to status/deletion before reading target role, preventing those operations from crossing a concurrent promotion with an outdated administrator check. After acquiring the lock, the caller’s active ADMIN role and sid-bound session are revalidated so queued operations cannot use revoked authority. The family-tree row lock and ownership checks remain intact.

Real HTTP covers protected administrator deletion/lock, family409, permitted deletion, stale-session revocation and concurrent administrative operations. Conditional cross-client versions remain absent. Two different administrators can still intentionally overwrite ordinary status changes sequentially. Backend’s final state and protections remain authoritative.
