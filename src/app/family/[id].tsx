import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { AppHeader, AppScreen } from '@/components/layout/app-screen';
import { ErrorState, LoadingState } from '@/components/feedback/states';
import { AppText } from '@/design-system/components/app-text';
import { Avatar } from '@/design-system/components/avatar';
import { DestructiveButton, PrimaryButton } from '@/design-system/components/buttons';
import { AppCard } from '@/design-system/components/surfaces';
import { spacing } from '@/design-system/tokens';
import { familyApi } from '@/features/family/api/familyApi';
import type { FamilyMember } from '@/features/family/types/family';
import { memberErrorMessage } from '@/features/family/validation/familyValidation';
import { useAppTheme } from '@/theme/theme-provider';

export default function FamilyMemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const memberId = Number(id);
  const { colors } = useAppTheme();
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!Number.isInteger(memberId) || memberId < 1) { setError('Mã thành viên không hợp lệ.'); setLoading(false); return; }
    setLoading(true); setError('');
    try { setMember(await familyApi.get(memberId)); } catch (cause) { setError(memberErrorMessage(cause)); }
    finally { setLoading(false); }
  }, [memberId]);
  useEffect(() => { void load(); }, [load]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const remove = () => {
    if (!member || deleting) return;
    Alert.alert('Xóa thành viên?', `Bạn có chắc muốn xóa ${member.fullName}?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => { void (async () => {
        setDeleting(true);
        try { await familyApi.delete(member.id); router.replace('/(tabs)/family'); }
        catch (cause) { Alert.alert('Chưa thể xóa thành viên', memberErrorMessage(cause)); }
        finally { setDeleting(false); }
      })(); } },
    ]);
  };
  if (loading) return <AppScreen padded centered><LoadingState label="Đang tải hồ sơ…" /></AppScreen>;
  if (error || !member) return <AppScreen padded><AppHeader title="Chi tiết thành viên" /><ErrorState title="Không thể mở thành viên" message={error || 'Không tìm thấy thành viên.'} retry={() => void load()} /></AppScreen>;
  const pair = (label: string, value?: string | null) => value ? <View style={styles.pair}><AppText variant="caption" tone="secondary">{label}</AppText><AppText>{value}</AppText></View> : null;
  return <AppScreen padded={false}><ScrollView contentContainerStyle={styles.content}>
    <AppHeader title="Chi tiết thành viên" />
    <AppCard inset style={styles.hero}><Avatar name={member.fullName} uri={member.avatarUrl ?? undefined} size={76} accent={colors.accentFamily} /><AppText variant="screenTitle">{member.fullName}</AppText><AppText tone="secondary">Thế hệ {member.generation}{member.role ? ` · ${member.role}` : ''}</AppText></AppCard>
    <AppCard inset style={styles.card}>{pair('Tình trạng', member.lifeStatus === 'LIVING' ? 'Còn sống' : 'Đã mất')}{pair('Ngày sinh', member.dateOfBirth)}{pair('Ngày mất', member.deathDate)}{pair('Giới tính', member.gender)}{pair('Số điện thoại', member.phoneNumber)}{pair('Địa chỉ', member.address)}{pair('Facebook', member.facebookUrl)}{pair('Instagram', member.instagramUrl)}{pair('Cha', member.fatherName)}{pair('Mẹ', member.motherName)}{pair('Vợ / chồng', member.spouseName)}{pair('Con', member.childNames.join(', '))}{pair('Tiểu sử', member.biography)}</AppCard>
    <PrimaryButton title="Sửa thông tin" onPress={() => router.push({ pathname: '/family/[id]/edit', params: { id: String(member.id) } })} />
    <DestructiveButton title={deleting ? 'Đang xóa…' : 'Xóa thành viên'} onPress={remove} loading={deleting} />
  </ScrollView></AppScreen>;
}

const styles = StyleSheet.create({ content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxxl }, hero: { alignItems: 'center', gap: spacing.sm }, card: { gap: spacing.md }, pair: { gap: spacing.xxs } });
