import { useCallback, useRef, useState } from 'react';
import { Alert, AppState, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AppScreen, AppScrollScreen, LargeTitleHeader } from '@/components/layout/app-screen';
import { LoadingState } from '@/components/feedback/states';
import { AppText } from '@/design-system/components/app-text';
import { AppCard } from '@/design-system/components/surfaces';
import { PrimaryButton, TextButton, DestructiveButton } from '@/design-system/components/buttons';
import { Badge, ChipRow, FilterChip } from '@/design-system/components/controls';
import { MyLifeSearchField } from '@/design-system/components/fields';
import { spacing } from '@/design-system/tokens';
import { useAuth } from '@/features/auth/context/auth-provider';
import type { AuthenticatedUser, UserRole } from '@/features/auth/types/auth';
import { useLocalization } from '@/localization/use-localization';
import { useAppTheme } from '@/theme/theme-provider';
import { accountWrites } from '@/features/profile/profile-api';
import { providerLabel } from '@/features/profile/profile-data';
import { m8Error, m8Strings, type M8Copy } from '@/features/profile/m8-strings';
import { adminApi } from './admin-api';
import { canAdminister, selectLogs, selectUsers, type StatusFilter, type UserSort, type LoginLog } from './admin-data';
import { useAdminResource } from './use-admin-resource';

export function AdminScreen({ mode }: { mode: 'dashboard' | 'users' | 'logs' }) {
  const { user, isAdmin } = useAuth();
  const { language } = useLocalization();
  if (!user || !isAdmin) return <AppScreen><AppText>{m8Strings[language].forbidden}</AppText></AppScreen>;
  if (mode === 'dashboard') return <Dashboard />;
  if (mode === 'logs') return <Logs />;
  return <Users accountId={user.id} />;
}
function Dashboard() {
  const query = useAdminResource(adminApi.stats);
  const { language } = useLocalization(); const copy = m8Strings[language];
  const { colors } = useAppTheme(); const data = query.data;
  const retry = () => void query.reload().catch(() => undefined);
  return <AppScrollScreen refreshControl={<RefreshControl refreshing={query.loading} onRefresh={retry} tintColor={colors.accentFamily} />}>
    <LargeTitleHeader title={copy.admin} subtitle={copy.dashboard} />
    <View style={styles.content}>
      <Feedback loading={query.loading} error={query.error} retry={retry} copy={copy} />
      {data ? <>
        {[['totalUsers', data.totalUsers], ['totalActive', data.totalActive], ['totalLocked', data.totalLocked], ['successLogins', data.last7Days.successLogins], ['failedLogins', data.last7Days.failedLogins], ['newRegistrations', data.last7Days.newRegistrations]].map(([key, value]) => <AppCard key={key} accessible accessibilityLabel={`${copy[key as 'totalUsers']} ${value}`} style={styles.card}><AppText tone="secondary">{copy[key as 'totalUsers']}</AppText><AppText variant="screenTitle">{value}</AppText></AppCard>)}
        <AppText variant="sectionTitle">{copy.distribution}</AppText>
        <AppText>{copy.active} {data.totalActive} / {data.totalUsers}</AppText><AppText>{copy.locked} {data.totalLocked} / {data.totalUsers}</AppText>
      </> : null}
    </View>
  </AppScrollScreen>;
}
function Feedback({ loading, error, retry, copy }: { loading: boolean; error: unknown; retry: () => void; copy: M8Copy }) {
  return <>{loading ? <LoadingState /> : null}{error ? <View style={styles.content}><AppText accessibilityRole="alert" tone="error">{m8Error(error, copy)}</AppText><PrimaryButton title={copy.retry} onPress={retry} /></View> : null}</>;
}
function Filters<T extends string>({ values, value, onChange, copy }: { values: T[]; value: T; onChange: (value: T) => void; copy: M8Copy }) {
  return <ChipRow>{values.map(item => <FilterChip key={item} label={item === 'USER' || item === 'ADMIN' ? item : copy[item as 'all']} selected={value === item} onPress={() => onChange(item)} />)}</ChipRow>;
}
function Users({ accountId }: { accountId: number }) {
  const query = useAdminResource(adminApi.users);
  const { language, locale } = useLocalization(); const copy = m8Strings[language];
  const { colors } = useAppTheme();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'all' | UserRole>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<UserSort>('newest');
  const [selected, setSelected] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const request = useRef(new AbortController());
  const alive = useRef(false); const submitted = useRef(false);
  const gate = accountWrites(accountId);
  useFocusEffect(useCallback(() => {
    alive.current = true;
    const subscription = AppState.addEventListener('change', next => { if (next !== 'active') request.current.abort(); });
    return () => { alive.current = false; subscription.remove(); request.current.abort(); };
  }, []));
  const reload = async () => {
    if (submitted.current) return;
    try { await query.reload(); await adminApi.stats(); if (alive.current) { gate.reconcile(); setMessage(''); } }
    catch (error) { if (alive.current) { setSuccess(false); setMessage(m8Error(error, copy)); } }
  };
  const mutate = async (target: AuthenticatedUser, action: 'role' | 'status' | 'delete', nextRole?: UserRole) => {
    if (submitted.current || !alive.current) return;
    submitted.current = true; setBusy(true); setMessage(''); setSuccess(false);
    request.current = new AbortController();
    query.cancel();
    try {
      await gate.run(async () => {
        await adminApi.mutate(accountId, target, action, request.current.signal, nextRole);
        await adminApi.stats(request.current.signal);
        await query.reload();
      });
      if (alive.current && !request.current.signal.aborted) { setSuccess(true); setMessage(copy.actionSuccess); setSelected(undefined); }
    } catch (error) {
      if (alive.current) { setMessage(m8Error(error, copy)); void query.reload().catch(() => undefined); }
    } finally { submitted.current = false; if (alive.current) setBusy(false); }
  };
  const confirm = (target: AuthenticatedUser, action: 'role' | 'status' | 'delete') => {
    const nextRole = target.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const title = action === 'delete' ? copy.deleteUser : action === 'role' ? nextRole === 'ADMIN' ? copy.promote : copy.demote : target.isActive ? copy.lock : copy.unlock;
    const warning = action === 'delete' ? copy.deleteWarning : action === 'role' ? copy.roleWarning : target.isActive ? copy.lockWarning : copy.unlockWarning;
    Alert.alert(title, `${target.email}\n\n${warning}`, [{ text: copy.cancel, style: 'cancel' }, { text: copy.confirm, style: action === 'delete' || action === 'status' && target.isActive ? 'destructive' : 'default', onPress: () => void mutate(target, action, nextRole) }]);
  };
  const data = selectUsers(query.data ?? [], search, role, status, sort);
  return <AppScreen><FlatList data={data} keyExtractor={item => String(item.id)} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" initialNumToRender={8} maxToRenderPerBatch={6} windowSize={5}
    refreshControl={<RefreshControl refreshing={query.loading} onRefresh={() => void reload()} tintColor={colors.accentFamily} />}
    ListHeaderComponent={<View style={styles.content}>
      <LargeTitleHeader title={copy.users} />
      <MyLifeSearchField label={copy.search} value={search} onChangeText={setSearch} autoCapitalize="none" />
      <AppText variant="label">{copy.role}</AppText><Filters values={['all', 'USER', 'ADMIN']} value={role} onChange={setRole} copy={copy} />
      <AppText variant="label">{copy.active} / {copy.locked}</AppText><Filters values={['all', 'active', 'locked']} value={status} onChange={setStatus} copy={copy} />
      <Filters values={['newest', 'oldest', 'emailAsc', 'emailDesc']} value={sort} onChange={setSort} copy={copy} />
      <Feedback loading={query.loading} error={query.error} retry={() => void reload()} copy={copy} />
      {message ? <AppText accessibilityRole="alert" tone={success ? 'success' : 'error'}>{message}</AppText> : null}
      {gate.uncertain ? <><AppText tone="error">{copy.uncertain}</AppText><PrimaryButton title={copy.retry} disabled={busy} onPress={() => void reload()} /></> : null}
    </View>}
    ListEmptyComponent={!query.loading && !query.error ? <AppText>{copy.noResults}</AppText> : undefined}
    renderItem={({ item }) => <AppCard style={styles.card}>
      <AppText variant="cardTitle" selectable>{item.email}</AppText><AppText>{item.displayName || item.fullName || '—'}</AppText>
      <View style={styles.badges}><Badge label={item.role} /><Badge label={item.isActive ? copy.active : copy.locked} tone={item.isActive ? 'success' : 'warning'} /></View>
      <AppText tone="secondary">{providerLabel(item)}</AppText><AppText variant="caption" tone="secondary">{copy.created} {timestamp(item.createdAt, locale)}</AppText>
      <TextButton title={copy.details} accessibilityState={{ expanded: selected === item.id }} onPress={() => setSelected(selected === item.id ? undefined : item.id)} />
      {selected === item.id ? <View style={styles.content}>
        <AppText>{copy.id} {item.id}</AppText><AppText>{copy.fullName} {item.fullName || '—'}</AppText><AppText>{copy.updated} {timestamp(item.updatedAt, locale)}</AppText>
        {canAdminister(accountId, item, 'role') ? <PrimaryButton title={item.role === 'ADMIN' ? copy.demote : copy.promote} disabled={busy || gate.uncertain} onPress={() => confirm(item, 'role')} /> : null}
        {canAdminister(accountId, item, 'status') ? <PrimaryButton title={item.isActive ? copy.lock : copy.unlock} disabled={busy || gate.uncertain} onPress={() => confirm(item, 'status')} /> : <AppText tone="secondary">{copy.protectedAccount}</AppText>}
        {canAdminister(accountId, item, 'delete') ? <DestructiveButton title={copy.deleteUser} disabled={busy || gate.uncertain} onPress={() => confirm(item, 'delete')} /> : null}
      </View> : null}
    </AppCard>} />
  </AppScreen>;
}
function timestamp(value: string | null | undefined, locale: string) {
  return value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
}
function Logs() {
  const query = useAdminResource(adminApi.logs);
  const { language, locale } = useLocalization(); const copy = m8Strings[language]; const { colors } = useAppTheme();
  const [search, setSearch] = useState(''); const [status, setStatus] = useState<'all' | LoginLog['status']>('all'); const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const retry = () => void query.reload().catch(() => undefined);
  return <AppScreen><FlatList data={selectLogs(query.data ?? [], search, status, sort)} keyExtractor={item => String(item.id)} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" initialNumToRender={10} windowSize={5}
    refreshControl={<RefreshControl refreshing={query.loading} onRefresh={retry} tintColor={colors.accentFamily} />}
    ListHeaderComponent={<View style={styles.content}>
      <LargeTitleHeader title={copy.logs} subtitle={copy.recentLogs} /><MyLifeSearchField label={copy.search} value={search} onChangeText={setSearch} autoCapitalize="none" />
      <ChipRow>{(['all', 'SUCCESS', 'FAILED', 'REGISTERED'] as const).map(value => <FilterChip key={value} label={value === 'all' ? copy.all : copy[value === 'SUCCESS' ? 'success' : value === 'FAILED' ? 'failed' : 'registered']} selected={status === value} onPress={() => setStatus(value)} />)}</ChipRow>
      <Filters values={['newest', 'oldest']} value={sort} onChange={setSort} copy={copy} /><Feedback loading={query.loading} error={query.error} retry={retry} copy={copy} />
    </View>}
    ListEmptyComponent={!query.loading && !query.error ? <AppText>{copy.noResults}</AppText> : undefined}
    renderItem={({ item }) => <AppCard style={styles.card}><AppText selectable>{item.attemptEmail}</AppText><Badge tone={item.status === 'FAILED' ? 'warning' : 'success'} label={copy[item.status === 'SUCCESS' ? 'success' : item.status === 'FAILED' ? 'failed' : 'registered']} /><AppText>{timestamp(item.createdAt, locale)}</AppText><AppText tone="secondary">{copy.ip} {item.ipAddress || '—'}</AppText></AppCard>} />
  </AppScreen>;
}
const styles = StyleSheet.create({ content: { gap: spacing.md, paddingBottom: spacing.lg }, card: { padding: spacing.lg, gap: spacing.sm }, badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm } });
