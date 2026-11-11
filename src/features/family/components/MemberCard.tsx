import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/design-system/components/app-text';
import { Badge } from '@/design-system/components/controls';
import { spacing } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';
import { formatDateOnly } from '@/features/home/home-data';
import type { FamilyMember } from '../types/family';
import { useFamilyStrings } from '../i18n/use-family-strings';
import { MemberAvatar } from './MemberAvatar';
export const MemberCard = memo(function MemberCard({ member, compact, onOpen }: { member: FamilyMember; compact: boolean; onOpen: (id: number) => void }) {
  const { colors } = useAppTheme(); const { copy, language } = useFamilyStrings();
  return <Pressable accessibilityRole="button" accessibilityLabel={`${copy.openProfile(member.fullName)}, ${copy.generationValue(member.generation)}, ${member.lifeStatus === 'DECEASED' ? copy.deceased : copy.living}`}
    onPress={() => onOpen(member.id)} style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, opacity: pressed ? .8 : 1 }, compact && styles.compact]}>
    <MemberAvatar member={member} size={compact ? 44 : 56} />
    <View style={styles.copy}>
      <AppText variant={compact ? 'bodyMedium' : 'cardTitle'}>{member.fullName}</AppText>
      <AppText variant="caption" tone="secondary">{copy.generationValue(member.generation)}{member.role ? ` · ${member.role}` : ''}</AppText>
      {compact ? <AppText variant="caption" tone="secondary">{member.lifeStatus === 'DECEASED' ? copy.deceased : copy.living}</AppText> : <>
        <Badge label={member.lifeStatus === 'DECEASED' ? copy.deceased : copy.living} />
        {member.dateOfBirth ? <AppText variant="caption" tone="secondary">{copy.birth}: {formatDateOnly(member.dateOfBirth, language)}</AppText> : null}
        {member.deathDate ? <AppText variant="caption" tone="secondary">{copy.death}: {formatDateOnly(member.deathDate, language)}</AppText> : null}
      </>}
    </View>
  </Pressable>;
});
const styles = StyleSheet.create({ card: { minHeight: 100, borderRadius: 20, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md }, compact: { minHeight: 72, padding: spacing.sm }, copy: { flex: 1, minWidth: 0, gap: spacing.xs } });
