import { Modal, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/design-system/components/app-text';
import { PrimaryButton, SecondaryButton, TextButton, DestructiveButton } from '@/design-system/components/buttons';
import { useAppTheme } from '@/theme/theme-provider';
import { eventKey, writable, type TimelineEvent } from './timeline-data';
import { anniversaryStrings } from '@/features/anniversaries/anniversary-strings';
import { dateLabel, displayTitle, type TimelineCopy } from './timeline-strings';
export function TimelineEventDetails({ event, names, copy, onClose, onEdit, onDelete }: { event: TimelineEvent; names: Map<number, string>; copy: TimelineCopy; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  const { colors, reducedMotion, language } = useAppTheme();
  const person = (id: number | null, label: string) => id ? <View style={{ gap: 8 }}><AppText variant="label">{label}</AppText><AppText>{names.get(id) ?? (id === event.memberId ? event.memberName : null) ?? `${copy.unknownMember} #${id}`}</AppText><TextButton title={`${copy.profile}: ${names.get(id) ?? copy.unknownMember}`} onPress={() => { onClose(); router.push({ pathname: '/family/[id]', params: { id: String(id) } }); }} /><TextButton title={copy.memberTimeline} onPress={() => { onClose(); router.push({ pathname: '/family/timeline', params: { memberId: String(id) } }); }} /></View> : null;
  return <Modal key={eventKey(event)} visible animationType={reducedMotion ? 'none' : 'slide'} onRequestClose={onClose}><SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 48 }}>
    <AppText variant="sectionTitle" accessibilityRole="header">{copy.details}</AppText><TextButton title={copy.close} onPress={onClose} /><AppText variant="screenTitle" selectable>{displayTitle(event, copy, event.memberId ? names.get(event.memberId) : undefined)}</AppText><AppText>{copy.types[event.eventType]}</AppText><AppText>{dateLabel(event, copy)}</AppText>
    {event.isDerived ? <><AppText variant="label">{copy.automatic}</AppText><AppText>{event.sourceType === 'FAMILY_MEMBER' ? copy.birthDeathHint : copy.anniversaryHint}</AppText></> : !writable(event) ? <AppText>{copy.legacy}</AppText> : null}
    {person(event.memberId, copy.primary)}{person(event.relatedMemberId, copy.related)}<AppText variant="label">{copy.description}</AppText><AppText selectable>{event.description || copy.noDescription}</AppText><AppText variant="label">{copy.location}</AppText><AppText selectable>{event.location || copy.noPlace}</AppText>{event.latitude !== null ? <AppText selectable>{event.latitude}, {event.longitude}</AppText> : null}
    <AppText>{copy.source}: {event.sourceType === 'FAMILY_MEMBER' ? copy.memberSource : event.sourceType === 'ANNIVERSARY' ? copy.anniversarySource : event.sourceType || copy.customSource}</AppText><AppText selectable>{copy.sourceReference}: {event.sourceId ?? event.id}</AppText>
    {event.isDerived && event.sourceType === 'ANNIVERSARY' && event.sourceId ? <TextButton title={anniversaryStrings[language ?? 'en'].manage} onPress={() => { onClose(); router.push({ pathname: '/family/anniversaries', params: { anniversaryId: String(event.sourceId) } }); }} /> : null}
    {writable(event) ? <><PrimaryButton title={copy.edit} onPress={onEdit} /><DestructiveButton title={copy.delete} onPress={onDelete} /></> : null}<SecondaryButton title={copy.close} onPress={onClose} />
  </ScrollView></SafeAreaView></Modal>;
}
export function TimelineDeleteDialog({ event, title, copy, busy, needsReconcile, error, onCancel, onConfirm }: { event: TimelineEvent; title: string; copy: TimelineCopy; busy: boolean; needsReconcile: boolean; error: string; onCancel: () => void; onConfirm: () => void }) {
  const { colors, reducedMotion } = useAppTheme();
  return <Modal visible animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={() => { if (!busy) onCancel(); }}><SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}><AppText variant="sectionTitle" accessibilityRole="header">{copy.deleteTitle}</AppText><AppText variant="cardTitle" selectable>{title}</AppText><AppText>{dateLabel(event, copy)}</AppText><AppText>{copy.deleteHint}</AppText>{error ? <AppText accessibilityRole="alert" tone="error">{error}</AppText> : null}<SecondaryButton title={copy.cancel} disabled={busy} onPress={onCancel} /><DestructiveButton title={copy.delete} loading={busy} disabled={needsReconcile} onPress={onConfirm} /></ScrollView></SafeAreaView></Modal>;
}
