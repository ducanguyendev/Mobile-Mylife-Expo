import { memo, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { AppCard } from '@/design-system/components/surfaces';
import { AppText } from '@/design-system/components/app-text';
import { Badge } from '@/design-system/components/controls';
import { TextButton } from '@/design-system/components/buttons';
import { useAppTheme } from '@/theme/theme-provider';
import type { Anniversary } from './anniversary-data';
import { anniversaryTypeLabel, countdownLabel, solarDateLabel, type AnniversaryCopy } from './anniversary-strings';

export const AnniversaryCard = memo(function AnniversaryCard({ item, copy, onDetails }: { item: Anniversary; copy: AnniversaryCopy; onDetails: (id: number) => void }) {
  const { colors, language } = useAppTheme();
  const date = useMemo(() => solarDateLabel(item.nextSolarDate, language, copy), [item.nextSolarDate, language, copy]);
  const open = useCallback(() => onDetails(item.id), [item.id, onDetails]);
  return <AppCard inset style={[styles.card, { borderLeftColor: item.eventType === 'DEATH_ANNIVERSARY' ? colors.accentAnniversary : colors.accentFamily }]}>
    <Badge label={anniversaryTypeLabel(item.eventType, copy)} /><AppText variant="cardTitle">{item.title}</AppText>
    {item.relatedMemberName ? <AppText>{item.relatedMemberName}</AppText> : null}<AppText>{date}</AppText><AppText variant="label">{countdownLabel(item, language, copy)}</AppText>
    {item.eventType === 'DEATH_ANNIVERSARY' ? <AppText>{copy.day} {item.lunarDay}/{item.lunarMonth}{item.isLeapMonth ? ` · ${copy.leap}` : ''}</AppText> : null}
    {item.place ? <AppText>{item.place}</AppText> : null}{item.host ? <AppText>{item.host}</AppText> : null}
    <TextButton title={copy.details} accessibilityLabel={`${copy.details} ${item.title}`} onPress={open} />
  </AppCard>;
});
const styles = StyleSheet.create({ card: { gap: 10, borderLeftWidth: 3 } });
