import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/design-system/components/app-text';
import { MyLifeTextField } from '@/design-system/components/fields';
import { PrimaryButton, SecondaryButton, TextButton } from '@/design-system/components/buttons';
import { TimelineMemberPicker } from '@/features/timeline/TimelineMemberPicker';
import { timelineStrings } from '@/features/timeline/timeline-strings';
import { dateParts } from '@/features/timeline/timeline-data';
import type { FamilyMember } from '@/features/family/types/family';
import { useAppTheme } from '@/theme/theme-provider';
import { anniversaryWrite, canChi, eligibleAnniversaryMembers, type Anniversary, type AnniversaryWrite } from './anniversary-data';
import { anniversaryDraftWrite, makeAnniversaryDraft, selectAnniversaryMember, switchAnniversaryType } from './anniversary-draft';
import { anniversaryError, countdownLabel, solarDateLabel, type AnniversaryCopy } from './anniversary-strings';
import { createLunarPreview, previewKey } from './lunar-preview';

type Props = {
  original: Anniversary | null;
  initial: AnniversaryWrite;
  members: FamilyMember[];
  copy: AnniversaryCopy;
  busy: boolean;
  needsReconcile: boolean;
  onCancel: () => void;
  onSave: (values: AnniversaryWrite) => Promise<void>;
};
export function AnniversaryEditor({ original, initial, members, copy, busy, needsReconcile, onCancel, onSave }: Props) {
  const { colors, language, reducedMotion } = useAppTheme();
  const [draft, setDraft] = useState(() => makeAnniversaryDraft(original ? anniversaryWrite(original) : initial));
  const [baseline] = useState(() => JSON.stringify(draft));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [preview] = useState(() => createLunarPreview());
  const previewState = useSyncExternalStore(preview.subscribe, preview.getSnapshot, preview.getSnapshot);
  const death = draft.values.eventType === 'DEATH_ANNIVERSARY';
  const selected = members.find(member => member.id === draft.values.relatedMemberId);
  const candidates = useMemo(() => eligibleAnniversaryMembers(members, draft.values.eventType), [members, draft.values.eventType]);
  const previewInput = useMemo(() => death ? {
    day: Number(draft.day), month: Number(draft.month),
    year: /^\d{4}$/.test(draft.year) ? Number(draft.year) : null, isLeapMonth: draft.values.isLeapMonth,
  } : null, [death, draft.day, draft.month, draft.year, draft.values.isLeapMonth]);
  useEffect(() => {
    preview.update(previewInput);
    return () => preview.cancel();
  }, [preview, previewInput, retry]);
  const currentPreview = previewState.key === previewKey(previewInput) ? previewState : undefined;
  const conversion = currentPreview?.conversion;
  const occurrence = currentPreview?.occurrence;
  const matched = conversion?.solarDate === draft.values.originalSolarDate;
  const update = (patch: Partial<AnniversaryWrite>) => {
    setError('');
    setDraft(value => ({ ...value, values: { ...value.values, ...patch } }));
  };
  const close = () => {
    if (busy) return;
    Keyboard.dismiss();
    if (JSON.stringify(draft) === baseline) onCancel();
    else Alert.alert(copy.discardTitle, copy.discardMessage, [
      { text: copy.keep, style: 'cancel' }, { text: copy.discard, style: 'destructive', onPress: onCancel },
    ]);
  };
  const save = async () => {
    if (busy || needsReconcile) return;
    Keyboard.dismiss();
    try {
      const input = anniversaryDraftWrite(draft, members);
      if (death && (currentPreview?.status !== 'ready' || !conversion || !occurrence)) throw new Error('ANNIVERSARY_PREVIEW_PENDING');
      if (death && !matched) throw new Error('FAMILY_ANNIVERSARY_DATE_MISMATCH');
      await onSave(input);
    } catch (requestError) { setError(anniversaryError(requestError, copy)); }
  };
  const lunarField = (field: 'day' | 'month' | 'year', label: string, maxLength: number) => (
    <MyLifeTextField label={label} accessibilityLabel={label} value={draft[field]} keyboardType="number-pad"
      maxLength={maxLength} disabled={busy} onChangeText={value => {
        setError('');
        setDraft(current => ({ ...current, [field]: value }));
      }} />
  );
  return (
    <Modal visible presentationStyle="fullScreen" animationType={reducedMotion ? 'none' : 'slide'} onRequestClose={close}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets
            contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 48 }}>
            <AppText variant="sectionTitle" accessibilityRole="header">{original ? copy.edit : copy.add}</AppText>
            <TextButton title={copy.cancel} disabled={busy} onPress={close} />
            <AppText variant="label">{copy.eventType}</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(['FAMILY_EVENT', 'DEATH_ANNIVERSARY'] as const).map(type => (
                <SecondaryButton key={type} title={type === 'FAMILY_EVENT' ? copy.family : copy.death}
                  disabled={busy} accessibilityState={{ selected: draft.values.eventType === type }}
                  style={{ flexGrow: 1, flexBasis: 140, borderWidth: draft.values.eventType === type ? 3 : 1 }}
                  onPress={() => { setError(''); setDraft(value => switchAnniversaryType(value, type, members)); }} />
              ))}
            </View>
            <MyLifeTextField label={copy.titleField} accessibilityLabel={copy.titleField} value={draft.values.title}
              onChangeText={title => update({ title })} maxLength={200} disabled={busy} />
            <AppText variant="label">{copy.member}</AppText>
            <AppText>{selected?.fullName ?? (draft.values.relatedMemberId ? copy.missingMember : copy.none)}</AppText>
            <SecondaryButton title={copy.pick} disabled={busy} onPress={() => setPickerOpen(true)} />
            {death ? <AppText tone="secondary">{copy.memberHelp}</AppText> : null}
            {death && selected && !dateParts(selected.deathDate) ? <>
              <AppText accessibilityRole="alert" tone="error">{copy.missingDeath}</AppText>
              <TextButton title={copy.memberDates} disabled={busy} onPress={() => {
                Alert.alert(copy.discardTitle, copy.discardMessage, [
                  { text: copy.keep, style: 'cancel' },
                  { text: copy.discard, style: 'destructive', onPress: () => {
                    onCancel();
                    router.push({ pathname: '/family/[id]/edit', params: { id: String(selected.id) } });
                  } },
                ]);
              }} />
            </> : null}
            <MyLifeTextField label={copy.original} accessibilityLabel={copy.original} placeholder={copy.dateHint}
              value={draft.values.originalSolarDate ?? ''} autoCapitalize="none" maxLength={10} disabled={busy}
              onChangeText={originalSolarDate => update({ originalSolarDate: originalSolarDate || null })} />
            <AppText tone="secondary">{copy.originalHelp}</AppText>
            {original && !original.originalSolarDate ? <AppText>{copy.legacy}</AppText> : null}
            {death ? <>
              {lunarField('day', copy.day, 2)}
              {lunarField('month', copy.lunarMonth, 2)}
              {lunarField('year', copy.lunarYear, 4)}
              <AppText tone="secondary">{copy.lunarHelp}</AppText>
              {previewInput?.year && canChi(previewInput.year) ? <AppText>{canChi(previewInput.year)}</AppText> : null}
              <SecondaryButton title={`${draft.values.isLeapMonth ? '✓ ' : '○ '}${copy.leap}`} disabled={busy}
                accessibilityRole="checkbox" accessibilityState={{ checked: draft.values.isLeapMonth }}
                onPress={() => update({ isLeapMonth: !draft.values.isLeapMonth })} />
              {draft.values.isLeapMonth ? <AppText>{copy.leapHelp}</AppText> : null}
              {currentPreview?.status === 'loading' ? <AppText accessibilityLiveRegion="polite">{copy.previewLoading}</AppText> : null}
              {currentPreview?.status === 'error' ? <AppText accessibilityRole="alert" tone="error">{anniversaryError(currentPreview.error, copy)}</AppText> : null}
              {conversion ? <View style={{ gap: 8 }}>
                <AppText variant="label">{copy.conversion}</AppText>
                <AppText>{solarDateLabel(conversion.solarDate, language, copy)}</AppText>
                <AppText tone={matched ? 'primary' : 'error'} accessibilityLiveRegion="polite">{matched ? copy.matched : copy.mismatch}</AppText>
              </View> : null}
              {occurrence ? <View style={{ gap: 8 }}>
                <AppText variant="label">{copy.nextDate}</AppText>
                <AppText>{solarDateLabel(occurrence.nextSolarDate, language, copy)}</AppText>
                <AppText>{countdownLabel(occurrence, language, copy)}</AppText>
                <AppText>{copy.nextYear} {canChi(occurrence.nextLunarYear)}</AppText>
                <AppText tone="secondary">{occurrence.isCurrentYearPassed ? copy.currentPassed : copy.currentNotPassed}</AppText>
              </View> : null}
              <TextButton title={copy.retryPreview} disabled={busy} onPress={() => setRetry(value => value + 1)} />
            </> : null}
            <MyLifeTextField label={death ? copy.deathPlace : copy.place} accessibilityLabel={copy.place} value={draft.values.place ?? ''}
              maxLength={500} disabled={busy} onChangeText={place => update({ place: place || null })} />
            <MyLifeTextField label={death ? copy.deathHost : copy.host} accessibilityLabel={copy.host} value={draft.values.host ?? ''}
              maxLength={300} disabled={busy} onChangeText={host => update({ host: host || null })} />
            <MyLifeTextField label={copy.notes} accessibilityLabel={copy.notes} value={draft.values.notes ?? ''} maxLength={2000}
              multiline style={{ minHeight: 120 }} disabled={busy} onChangeText={notes => update({ notes: notes || null })} />
            {error || needsReconcile ? <AppText accessibilityRole="alert" tone="error">{needsReconcile ? copy.uncertain : error}</AppText> : null}
            {busy ? <AppText accessibilityLiveRegion="polite">{copy.saving}</AppText> : null}
            <PrimaryButton title={copy.save} loading={busy} disabled={needsReconcile} onPress={() => void save()} />
            <SecondaryButton title={copy.cancel} disabled={busy} onPress={close} />
          </ScrollView>
        </KeyboardAvoidingView>
        {pickerOpen ? <TimelineMemberPicker members={candidates} selected={draft.values.relatedMemberId}
          copy={timelineStrings[language]} onCancel={() => setPickerOpen(false)} onConfirm={id => {
            try {
              setDraft(selectAnniversaryMember(draft, id, members));
              setError('');
            } catch (selectionError) { setError(anniversaryError(selectionError, copy)); }
            setPickerOpen(false);
          }} /> : null}
      </SafeAreaView>
    </Modal>
  );
}
