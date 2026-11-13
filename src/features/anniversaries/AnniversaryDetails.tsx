import { Modal, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/design-system/components/app-text';
import { DestructiveButton, PrimaryButton, SecondaryButton, TextButton } from '@/design-system/components/buttons';
import { useAppTheme } from '@/theme/theme-provider';
import { canChi, type Anniversary } from './anniversary-data';
import { anniversaryTypeLabel, countdownLabel, solarDateLabel, type AnniversaryCopy } from './anniversary-strings';

type Props = { item: Anniversary; copy: AnniversaryCopy; disabled: boolean; onClose: () => void; onEdit: () => void; onDelete: () => void };
export function AnniversaryDetails({ item, copy, disabled, onClose, onEdit, onDelete }: Props) {
  const { colors, language, reducedMotion } = useAppTheme();
  const pair = (label: string, value: string | null) => <View style={{ gap: 4 }}><AppText variant="label">{label}</AppText><AppText selectable>{value || copy.noValue}</AppText></View>;
  const death = item.eventType === 'DEATH_ANNIVERSARY';
  return <Modal visible animationType={reducedMotion ? 'none' : 'slide'} onRequestClose={onClose}>
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 48 }}>
        <AppText variant="sectionTitle" accessibilityRole="header">{copy.details}</AppText>
        <TextButton title={copy.close} onPress={onClose} />
        <AppText variant="screenTitle" selectable>{item.title}</AppText>
        <AppText>{anniversaryTypeLabel(item.eventType, copy)}</AppText>
        {pair(copy.original, solarDateLabel(item.originalSolarDate, language, copy))}
        {pair(copy.nextDate, solarDateLabel(item.nextSolarDate, language, copy))}
        <AppText>{countdownLabel(item, language, copy)}</AppText>
        {item.lunarDay && item.lunarMonth ? <>
          {pair(copy.day, `${item.lunarDay}/${item.lunarMonth}${item.isLeapMonth ? ` · ${copy.leap}` : ''}`)}
          {item.lunarYear !== null ? pair(copy.lunarYear, canChi(item.lunarYear)) : null}
          {item.nextLunarYear !== null ? pair(copy.nextYear, canChi(item.nextLunarYear)) : null}
        </> : null}
        {!item.originalSolarDate ? <AppText>{copy.legacy}</AppText> : null}
        {pair(copy.member, item.relatedMemberName)}
        {item.relatedMemberId ? <TextButton title={copy.profile} onPress={() => {
          onClose();
          router.push({ pathname: '/family/[id]', params: { id: String(item.relatedMemberId) } });
        }} /> : null}
        {pair(death ? copy.deathPlace : copy.place, item.place)}
        {pair(death ? copy.deathHost : copy.host, item.host)}
        {pair(copy.notes, item.notes)}
        <PrimaryButton title={copy.edit} disabled={disabled} onPress={onEdit} />
        <DestructiveButton title={copy.remove} disabled={disabled} onPress={onDelete} />
        <SecondaryButton title={copy.close} onPress={onClose} />
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}
export function AnniversaryDeleteDialog({ item, copy, busy, needsReconcile, error, onCancel, onConfirm }: {
  item: Anniversary; copy: AnniversaryCopy; busy: boolean; needsReconcile: boolean; error: string; onCancel: () => void; onConfirm: () => void;
}) {
  const { colors, reducedMotion } = useAppTheme();
  return <Modal visible animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={() => { if (!busy) onCancel(); }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <AppText variant="sectionTitle" accessibilityRole="header">{copy.deleteTitle}</AppText>
        <AppText variant="cardTitle" selectable>{item.title}</AppText>
        <AppText>{copy.deleteHint}</AppText>
        {error ? <AppText accessibilityRole="alert" tone="error">{error}</AppText> : null}
        <SecondaryButton title={copy.cancel} disabled={busy} onPress={onCancel} />
        <DestructiveButton title={copy.remove} loading={busy} disabled={needsReconcile} onPress={onConfirm} />
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}
