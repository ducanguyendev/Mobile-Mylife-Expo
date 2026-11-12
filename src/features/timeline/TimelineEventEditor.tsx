import { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/design-system/components/app-text';
import { MyLifeTextField } from '@/design-system/components/fields';
import { PrimaryButton, SecondaryButton, TextButton } from '@/design-system/components/buttons';
import { SegmentedTabs } from '@/design-system/components/controls';
import type { FamilyMember } from '@/features/family/types/family';
import { useAppTheme } from '@/theme/theme-provider';
import { creatableTypes, draftWrite, eventWrite, makeDraft, type TimelineEvent, type TimelineWrite } from './timeline-data';
import { actionError, type TimelineCopy } from './timeline-strings';
import { TimelineMemberPicker } from './TimelineMemberPicker';
type Props = { original: TimelineEvent | null; initial: TimelineWrite; members: FamilyMember[]; copy: TimelineCopy; busy: boolean; needsReconcile: boolean; onCancel: () => void; onSave: (input: TimelineWrite) => Promise<void> };
export function TimelineEventEditor({ original, initial, members, copy, busy, needsReconcile, onCancel, onSave }: Props) {
  const { colors, reducedMotion } = useAppTheme(); const [draft, setDraft] = useState(() => makeDraft(original ? eventWrite(original) : initial));
  const [baseline] = useState(() => JSON.stringify(draft)); const [error, setError] = useState(''); const [picker, setPicker] = useState<'memberId' | 'relatedMemberId' | null>(null); const [showCoordinates, setShowCoordinates] = useState((original ?? initial).latitude !== null || (original ?? initial).longitude !== null);
  const close = () => { if (busy) return; Keyboard.dismiss(); if (JSON.stringify(draft) === baseline) onCancel(); else Alert.alert(copy.discardTitle, copy.discardMessage, [{ text: copy.keep, style: 'cancel' }, { text: copy.discard, style: 'destructive', onPress: onCancel }]); };
  const update = (patch: Partial<TimelineWrite>) => { setError(''); setDraft(d => ({ ...d, values: { ...d.values, ...patch } })); };
  const field = (key: 'date' | 'year' | 'latitude' | 'longitude', value: string) => { setError(''); setDraft(d => ({ ...d, [key]: value })); };
  const save = async () => { if (busy || needsReconcile) return; Keyboard.dismiss(); try { const input = draftWrite(draft, original ?? undefined); await onSave(input); } catch (e) { setError(actionError(e, copy, needsReconcile)); } };
  const types = [...creatableTypes]; if (original && !types.includes(original.eventType)) types.push(original.eventType);
  const person = (key: 'memberId' | 'relatedMemberId', label: string) => <View style={{ gap: 4 }}><AppText variant="label">{label}</AppText><AppText>{members.find(m => m.id === draft.values[key])?.fullName ?? (draft.values[key] ? `${copy.unknownMember} #${draft.values[key]}` : copy.none)}</AppText><SecondaryButton title={`${copy.pick}: ${label}`} disabled={busy} onPress={() => setPicker(key)} /></View>;
  return <Modal visible animationType={reducedMotion ? 'none' : 'slide'} onRequestClose={close} presentationStyle="fullScreen"><SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 48 }}>
      <AppText variant="sectionTitle" accessibilityRole="header">{original ? copy.edit : copy.add}</AppText><TextButton title={copy.cancel} onPress={close} disabled={busy} />
      <AppText variant="label">{copy.eventType}</AppText><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{types.map(type => <SecondaryButton compact key={type} title={copy.types[type]} accessibilityState={{ selected: draft.values.eventType === type }} disabled={busy} onPress={() => update({ eventType: type })} style={{ borderWidth: draft.values.eventType === type ? 3 : 1, flexGrow: 1, flexBasis: 130 }} />)}</View>
      <MyLifeTextField label={copy.formTitle} accessibilityLabel={copy.formTitle} value={draft.values.title} onChangeText={title => update({ title })} maxLength={200} disabled={busy} />
      <AppText variant="label">{copy.dateMode}</AppText><SegmentedTabs<'date' | 'year'> value={draft.mode} onChange={mode => { if (!busy) setDraft(d => ({ ...d, mode })); }} options={[{ value: 'date', label: copy.exact }, { value: 'year', label: copy.yearOnly }]} />
      <AppText tone="secondary">{copy.dateHelp}</AppText>{draft.mode === 'date' ? <MyLifeTextField label={copy.date} accessibilityLabel={copy.date} placeholder="YYYY-MM-DD" value={draft.date} onChangeText={date => field('date', date)} autoCapitalize="none" maxLength={10} disabled={busy} /> : <MyLifeTextField label={copy.year} accessibilityLabel={copy.year} value={draft.year} onChangeText={year => field('year', year)} keyboardType="number-pad" maxLength={4} disabled={busy} />}
      <SecondaryButton title={`${draft.values.isApproximate ? '✓ ' : '○ '}${copy.approximate}`} accessibilityRole="checkbox" accessibilityState={{ checked: draft.values.isApproximate }} disabled={busy} onPress={() => update({ isApproximate: !draft.values.isApproximate })} />
      {person('memberId', copy.primary)}{person('relatedMemberId', copy.related)}
      <MyLifeTextField label={copy.description} accessibilityLabel={copy.description} value={draft.values.description ?? ''} onChangeText={description => update({ description: description || null })} maxLength={2000} multiline disabled={busy} style={{ minHeight: 120 }} />
      <MyLifeTextField label={copy.location} accessibilityLabel={copy.location} value={draft.values.location ?? ''} onChangeText={location => update({ location: location || null })} maxLength={500} disabled={busy} />
      <TextButton title={copy.coordinates} onPress={() => setShowCoordinates(v => !v)} disabled={busy} accessibilityState={{ expanded: showCoordinates }} />
      {showCoordinates ? <><AppText tone="secondary">{copy.coordinateHelp}</AppText><MyLifeTextField label={copy.latitude} accessibilityLabel={copy.latitude} value={draft.latitude} onChangeText={text => field('latitude', text)} keyboardType="numbers-and-punctuation" disabled={busy} /><MyLifeTextField label={copy.longitude} accessibilityLabel={copy.longitude} value={draft.longitude} onChangeText={text => field('longitude', text)} keyboardType="numbers-and-punctuation" disabled={busy} /></> : null}
      {error || needsReconcile ? <AppText accessibilityRole="alert" tone="error">{needsReconcile ? copy.uncertain : error}</AppText> : null}
      {busy ? <AppText accessibilityLiveRegion="polite">{copy.saving}</AppText> : null}<PrimaryButton title={copy.save} loading={busy} disabled={needsReconcile} onPress={() => void save()} /><SecondaryButton title={copy.cancel} disabled={busy} onPress={close} />
    </ScrollView></KeyboardAvoidingView>
    {picker ? <TimelineMemberPicker members={members} selected={draft.values[picker]} copy={copy} onCancel={() => setPicker(null)} onConfirm={id => { update({ [picker]: id }); setPicker(null); }} /> : null}
  </SafeAreaView></Modal>;
}
