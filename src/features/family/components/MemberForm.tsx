import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { familyApi } from '@/features/family/api/familyApi';
import type { FamilyMember, Generation } from '@/features/family/types/family';
import { backendFieldErrors, memberErrorMessage, toFamilyInput, validateMember, type FormErrors, type FormValues } from '@/features/family/validation/familyValidation';
import { MyLifeTextArea, MyLifeTextField } from '@/design-system/components/fields';
import { AppText } from '@/design-system/components/app-text';
import { PrimaryButton, SecondaryButton } from '@/design-system/components/buttons';
import { AppCard } from '@/design-system/components/surfaces';
import { LoadingState } from '@/components/feedback/states';
import { spacing } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';

const empty: FormValues = { fullName: '', generation: '1', gender: '', dateOfBirth: '', lifeStatus: 'LIVING', deathDate: '', role: '', address: '', phoneNumber: '', facebookUrl: '', instagramUrl: '', biography: '', fatherId: '', motherId: '', spouseId: '', childIds: [] };

export function MemberForm({ member, onSaved, onCancel }: { member?: FamilyMember; onSaved: (member: FamilyMember) => void; onCancel: () => void }) {
  const { colors } = useAppTheme();
  const [values, setValues] = useState<FormValues>(empty);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (member) setValues({
      fullName: member.fullName, generation: String(member.generation), gender: member.gender ?? '', dateOfBirth: member.dateOfBirth ?? '',
      lifeStatus: member.lifeStatus, deathDate: member.deathDate ?? '', role: member.role ?? '', address: member.address ?? '',
      phoneNumber: member.phoneNumber ?? '', facebookUrl: member.facebookUrl ?? '', instagramUrl: member.instagramUrl ?? '',
      biography: member.biography ?? '', fatherId: member.fatherId ? String(member.fatherId) : '', motherId: member.motherId ? String(member.motherId) : '',
      spouseId: member.spouseId ? String(member.spouseId) : '', childIds: member.childIds.map(String),
    });
    let active = true;
    void Promise.all([familyApi.list(), familyApi.generations()]).then(([list, generationList]) => {
      if (!active) return;
      setMembers(list);
      setGenerations(generationList);
      setLoadingRefs(false);
    }).catch((error: unknown) => {
      if (!active) return;
      setNotice(memberErrorMessage(error));
      setLoadingRefs(false);
    });
    return () => { active = false; };
  }, [member]);

  const candidates = useMemo(() => members.filter((item) => item.id !== member?.id), [members, member?.id]);
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => setValues((previous) => ({ ...previous, [key]: value }));
  const choose = (title: string, key: 'fatherId' | 'motherId' | 'spouseId') => Alert.alert(title, undefined, [
    { text: 'Bỏ chọn', onPress: () => set(key, '') },
    ...candidates.slice(0, 8).map((item) => ({ text: item.fullName, onPress: () => set(key, String(item.id)) })),
    { text: 'Đóng', style: 'cancel' },
  ]);
  const save = async () => {
    if (saving) return;
    const nextErrors = validateMember(values);
    setErrors(nextErrors);
    setNotice('');
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    try {
      const input = toFamilyInput(values);
      const saved = member ? await familyApi.update(member.id, input) : await familyApi.create(input);
      onSaved(saved);
    } catch (error) {
      setErrors(backendFieldErrors(error));
      setNotice(memberErrorMessage(error));
    } finally { setSaving(false); }
  };
  const relationLabel = (id: string, name: string) => id ? candidates.find((item) => String(item.id) === id)?.fullName ?? 'Chưa chọn' : 'Chưa chọn';
  const relationField = (label: string, key: 'fatherId' | 'motherId' | 'spouseId') => (
    <Pressable accessibilityRole="button" onPress={() => choose(label, key)} style={[styles.select, { borderColor: errors[key] ? colors.error : colors.border, backgroundColor: colors.surfaceElevated }]}>
      <AppText variant="caption" tone="secondary">{label}</AppText><AppText>{relationLabel(values[key], label)}</AppText>
      {errors[key] ? <AppText variant="caption" tone="error">{errors[key]}</AppText> : null}
    </Pressable>
  );
  const dropdown = (label: string, key: 'lifeStatus' | 'gender', options: { label: string; value: string }[]) => (
    <View style={styles.group}><AppText variant="label">{label}</AppText><View style={styles.chips}>{options.map((option) => {
      const active = values[key] === option.value;
      return <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => set(key, option.value as never)} style={[styles.chip, { borderColor: active ? colors.accentFamily : colors.border, backgroundColor: active ? colors.surfaceMuted : colors.surface }]}><AppText>{option.label}</AppText></Pressable>;
    })}</View></View>
  );
  const text = (label: string, key: keyof FormValues, props: { keyboardType?: 'default' | 'phone-pad' | 'numeric' | 'url'; multiline?: boolean } = {}) => {
    const value = values[key];
    if (typeof value !== 'string') return null;
    const common = { label, value, onChangeText: (next: string) => set(key, next), error: errors[key], autoCapitalize: key === 'facebookUrl' || key === 'instagramUrl' ? 'none' as const : 'sentences' as const, keyboardType: props.keyboardType, multiline: props.multiline };
    return props.multiline ? <MyLifeTextArea {...common} /> : <MyLifeTextField {...common} />;
  };

  if (loadingRefs) return <LoadingState label="Đang tải danh sách quan hệ…" />;
  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <MyLifeTextField label="Họ và tên *" value={values.fullName} onChangeText={(value) => set('fullName', value)} error={errors.fullName} maxLength={100} />
      <MyLifeTextField label="Thế hệ *" value={values.generation} onChangeText={(value) => set('generation', value.replace(/[^0-9]/g, ''))} keyboardType="numeric" error={errors.generation} helperText={generations.map((item) => item.title || item.name).join(' · ') || 'Số thế hệ bắt đầu từ 1'} />
      {dropdown('Giới tính', 'gender', [{ label: 'Chưa chọn', value: '' }, { label: 'Nam', value: 'male' }, { label: 'Nữ', value: 'female' }, { label: 'Khác', value: 'other' }])}
      {text('Ngày sinh (YYYY-MM-DD)', 'dateOfBirth')}
      {dropdown('Tình trạng', 'lifeStatus', [{ label: 'Còn sống', value: 'LIVING' }, { label: 'Đã mất', value: 'DECEASED' }])}
      {values.lifeStatus === 'DECEASED' ? text('Ngày mất (YYYY-MM-DD) *', 'deathDate') : null}
      {text('Vai trò', 'role')}{text('Số điện thoại', 'phoneNumber', { keyboardType: 'phone-pad' })}
      {text('Địa chỉ', 'address')}{text('Facebook URL', 'facebookUrl', { keyboardType: 'url' })}{text('Instagram URL', 'instagramUrl', { keyboardType: 'url' })}
      {relationField('Cha', 'fatherId')}{relationField('Mẹ', 'motherId')}{relationField('Vợ / chồng', 'spouseId')}
      <AppCard inset style={styles.childrenCard}>
        <AppText variant="label">Con</AppText><AppText variant="caption" tone="secondary">Chọn hoặc bỏ chọn con của thành viên này. Quan hệ được lưu cùng biểu mẫu.</AppText>
        <View style={styles.chips}>{candidates.map((item) => {
          const checked = values.childIds.includes(String(item.id));
          return <Pressable key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => set('childIds', checked ? values.childIds.filter((id) => id !== String(item.id)) : [...values.childIds, String(item.id)])} style={[styles.chip, { borderColor: checked ? colors.accentFamily : colors.border, backgroundColor: checked ? colors.surfaceMuted : colors.surface }]}><AppText>{item.fullName}</AppText></Pressable>;
        })}</View>
      </AppCard>
      {text('Tiểu sử', 'biography', { multiline: true })}
      {errors.form ? <AppText tone="error">{errors.form}</AppText> : null}
      {notice ? <AppText tone="error">{notice}</AppText> : null}
      <View style={styles.actions}><PrimaryButton title={saving ? 'Đang lưu…' : 'Lưu thành viên'} onPress={() => void save()} loading={saving} /><SecondaryButton title="Hủy" onPress={onCancel} disabled={saving} /></View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ flex: { flex: 1 }, content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxxl }, group: { gap: spacing.xs }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }, chip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderWidth: 1, borderRadius: 18 }, select: { borderWidth: 1, borderRadius: 12, padding: spacing.md, gap: spacing.xs }, childrenCard: { gap: spacing.sm }, actions: { gap: spacing.sm, marginTop: spacing.sm } });
