import { memo, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { AppCard } from '@/design-system/components/surfaces';
import { AppText } from '@/design-system/components/app-text';
import { Badge } from '@/design-system/components/controls';
import { TextButton } from '@/design-system/components/buttons';
import { useAppTheme } from '@/theme/theme-provider';
import { writable, type TimelineEvent } from './timeline-data';
import { dateLabel, displayTitle, type TimelineCopy } from './timeline-strings';

export const TimelineCard = memo(function TimelineCard({ item, memberName, relatedName, copy, onDetails }: { item: TimelineEvent; memberName?: string; relatedName?: string; copy: TimelineCopy; onDetails: (event: TimelineEvent) => void }) {
  const { colors } = useAppTheme();
  const title = useMemo(() => displayTitle(item, copy, memberName), [item, copy, memberName]);
  const date = useMemo(() => dateLabel(item, copy), [item, copy]);
  const open = useCallback(() => onDetails(item), [item, onDetails]);
  return <AppCard inset style={[styles.card, { borderLeftColor: colors.accentTimeline }]}>
    <AppText variant="caption" tone="secondary">{date}</AppText><Badge label={copy.types[item.eventType]} /><AppText variant="cardTitle">{title}</AppText>
    {item.memberId || item.relatedMemberId ? <AppText>{[item.memberId ? memberName ?? item.memberName ?? copy.unknownMember : null, item.relatedMemberId ? relatedName ?? copy.unknownMember : null].filter(Boolean).join(' · ')}</AppText> : null}
    {item.description ? <AppText tone="secondary" numberOfLines={3}>{item.description}</AppText> : null}{item.location ? <AppText tone="secondary">{item.location}</AppText> : null}
    {item.isDerived ? <AppText variant="caption">{copy.automatic}</AppText> : !writable(item) ? <AppText variant="caption">{copy.legacy}</AppText> : null}
    <TextButton title={copy.details} accessibilityLabel={`${copy.details}: ${title}`} onPress={open} />
  </AppCard>;
});
const styles = StyleSheet.create({ card: { gap: 10, borderLeftWidth: 3 } });
