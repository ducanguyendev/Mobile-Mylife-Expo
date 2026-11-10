import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { AppScreen, LargeTitleHeader, SectionHeader } from '@/components/layout/app-screen';
import { ErrorState, LoadingState } from '@/components/feedback/states';
import { AppIcon } from '@/design-system/components/app-icon';
import { AppText } from '@/design-system/components/app-text';
import { Avatar } from '@/design-system/components/avatar';
import { PrimaryButton } from '@/design-system/components/buttons';
import { MyLifeSearchField } from '@/design-system/components/fields';
import { ActionRow, AppCard, InfoCard } from '@/design-system/components/surfaces';
import { spacing } from '@/design-system/tokens';
import { useAuth } from '@/features/auth/context/auth-provider';
import { familyApi } from '@/features/family/api/familyApi';
import type { FamilyMember } from '@/features/family/types/family';
import { memberErrorMessage } from '@/features/family/validation/familyValidation';
import { useAppTheme } from '@/theme/theme-provider';

type ViewTab = 'members' | 'tree' | 'map';

export default function FamilyScreen() {
  const { user } = useAuth();
  return <FamilyScreenContent key={user?.id ?? 'anonymous'} />;
}

function FamilyScreenContent() {
  const { isAdmin, isUser } = useAuth();
  const { colors } = useAppTheme();
  const [tab, setTab] = useState<ViewTab>('members');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (!isUser) return;
    setError('');
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try { setMembers(await familyApi.list()); }
    catch (cause) { setError(memberErrorMessage(cause)); }
    finally { setLoading(false); setRefreshing(false); }
  }, [isUser]);

  // The keyed content resets on account changes; focus owns the initial load and revisits.
  useFocusEffect(useCallback(() => { if (isUser) void load(true); }, [isUser, load]));

  const visibleMembers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi');
    return members.filter((item) => !normalized || item.fullName.toLocaleLowerCase('vi').includes(normalized));
  }, [members, query]);
  const generationCount = useMemo(() => new Set(members.map((item) => item.generation)).size, [members]);

  if (isAdmin) return <AppScreen padded><LargeTitleHeader eyebrow="GIA ĐÌNH" title="Gia đình" subtitle="Quản lý thành viên và thông tin gia đình." /><AppCard inset style={styles.adminCard}><AppIcon name={{ ios: 'person.badge.shield.checkmark', android: 'admin_panel_settings', web: 'admin_panel_settings' }} color={colors.accentFamily} size={30} /><AppText variant="cardTitle">Tài khoản quản trị</AppText><AppText tone="secondary">Tài khoản ADMIN không sử dụng cây gia đình cá nhân. Hãy đăng nhập bằng tài khoản USER để quản lý thành viên.</AppText></AppCard></AppScreen>;
  if (!isUser) return <AppScreen padded centered><LoadingState label="Đang kiểm tra phiên đăng nhập…" /></AppScreen>;

  const tabs: { id: ViewTab; label: string }[] = [{ id: 'members', label: 'Thành viên' }, { id: 'tree', label: 'Cây' }, { id: 'map', label: 'Bản đồ' }];
  return <AppScreen padded={false}>
    <FlatList
      data={tab === 'members' && !loading && !error ? visibleMembers : []}
      keyExtractor={(item) => String(item.id)}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.accentFamily} />}
      ListHeaderComponent={<View style={styles.header}><LargeTitleHeader eyebrow="CÙNG MỘT GỐC RỄ" title="Gia đình" subtitle="Những người làm nên câu chuyện của bạn." />
        <View style={styles.tabs}>{tabs.map((item) => <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: tab === item.id }} onPress={() => setTab(item.id)} style={[styles.tab, { backgroundColor: tab === item.id ? colors.accentFamily : colors.surfaceMuted }]}><AppText style={{ color: tab === item.id ? colors.onAccent : colors.textSecondary }}>{item.label}</AppText></Pressable>)}</View>
        {tab === 'members' ? <><View style={styles.stats}><InfoCard label="Thành viên" value={`${members.length} người`} /><InfoCard label="Thế hệ" value={`${generationCount} thế hệ`} accent={colors.accentTimeline} /></View><SectionHeader title="Thành viên" action={<PrimaryButton compact title="Thêm" onPress={() => router.push('/family/new')} />} /><MyLifeSearchField value={query} onChangeText={setQuery} placeholder="Tìm theo tên" /></> : null}
      </View>}
      ListEmptyComponent={tab !== 'members' ? <AppCard inset style={styles.placeholder}><AppText variant="cardTitle">{tab === 'tree' ? 'Cây gia đình' : 'Bản đồ gia đình'}</AppText><AppText tone="secondary">Tính năng này sẽ có trong giai đoạn tiếp theo.</AppText></AppCard> : loading ? <LoadingState label="Đang tải thành viên…" /> : error ? <ErrorState title="Không thể tải thành viên" message={error} retry={() => void load()} /> : <AppCard inset style={styles.placeholder}><AppText variant="cardTitle">{query ? 'Không tìm thấy thành viên' : 'Chưa có thành viên'}</AppText><AppText tone="secondary">{query ? 'Thử tìm bằng tên khác.' : 'Thêm thành viên đầu tiên vào cây gia đình của bạn.'}</AppText>{!query ? <PrimaryButton compact title="Thêm thành viên" onPress={() => router.push('/family/new')} /> : null}</AppCard>}
      renderItem={({ item }) => <AppCard style={styles.memberCard}><ActionRow onPress={() => router.push({ pathname: '/family/[id]', params: { id: String(item.id) } })} title={item.fullName} detail={`${item.role ? `${item.role} · ` : ''}Thế hệ ${item.generation}${item.dateOfBirth ? ` · Sinh ${item.dateOfBirth.slice(0, 4)}` : ''}${item.lifeStatus === 'DECEASED' ? ' · Đã mất' : ''}`} leading={<Avatar name={item.fullName} uri={item.avatarUrl ?? undefined} size={48} accent={colors.accentFamily} />} trailing={<AppIcon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} color={colors.textTertiary} />} /></AppCard>}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
    />
  </AppScreen>;
}

const styles = StyleSheet.create({ listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm }, header: { gap: spacing.md, marginBottom: spacing.sm }, tabs: { flexDirection: 'row', gap: spacing.xs, backgroundColor: 'transparent' }, tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: 18 }, stats: { flexDirection: 'row', gap: spacing.sm }, memberCard: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }, placeholder: { gap: spacing.sm }, adminCard: { alignItems: 'flex-start', gap: spacing.sm } });
