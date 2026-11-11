import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { usePreventRemove } from 'expo-router';
import { MyLifeTextArea, MyLifeTextField } from '@/design-system/components/fields';
import { AppText } from '@/design-system/components/app-text';
import { PrimaryButton, SecondaryButton, TextButton } from '@/design-system/components/buttons';
import { AppCard } from '@/design-system/components/surfaces';
import { ErrorState } from '@/components/feedback/states';
import { useToast } from '@/components/feedback/toast-provider';
import { useAuth } from '@/features/auth/context/auth-provider';
import { spacing } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';
import { familyApi } from '../api/familyApi';
import { familyDataApi, requireMember } from '../api/familyDataApi';
import type { FamilyMember, Generation, HorizontalRelation } from '../types/family';
import { memberToFormValues, type FormErrors, type FormValues } from '../validation/familyValidation';
import { buildMemberCreate, buildMemberUpdate, emptyMemberValues, hasMemberChanges, MemberConflict, validateMemberEdit } from '../data/member-edit';
import { familyError, localizedFieldErrors } from '../data/family-errors';
import { normalizeGender, sharedParentSiblings } from '../data/member-search';
import { useFamilyStrings } from '../i18n/use-family-strings';
import { RelationshipPicker } from './RelationshipPicker';

type RelationField = 'fatherId' | 'motherId' | 'spouseId' | 'childIds' | 'horizontal';
type Props = { member?: FamilyMember; onSaved: (member: FamilyMember) => void; onCancel: () => void; onReload?: () => void };
export function MemberForm({ member, onSaved, onCancel, onReload }: Props) {
  const { colors } = useAppTheme(); const { copy } = useFamilyStrings(); const { showToast } = useToast(); const { status } = useAuth();
  const original = useMemo(() => member ? memberToFormValues(member) : { ...emptyMemberValues, childIds: [] }, [member]);
  const [values, setValues] = useState<FormValues>(() => original);
  const [relations, setRelations] = useState<HorizontalRelation[]>(() => member?.horizontalRelations.map(row => ({ ...row })) ?? []);
  const [members, setMembers] = useState<FamilyMember[]>([]); const [generations, setGenerations] = useState<Generation[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true); const [refsError, setRefsError] = useState<unknown>(); const [refsRevision, setRefsRevision] = useState(0);
  const [saving, setSaving] = useState(false); const savingRef = useRef(false); const alive = useRef(true);
  const [errors, setErrors] = useState<FormErrors>({}); const [notice, setNotice] = useState('');
  const [conflict, setConflict] = useState(false); const [uncertainCreation, setUncertainCreation] = useState(false); const [allowLeave, setAllowLeave] = useState(false);
  const [picker, setPicker] = useState<RelationField>();
  const dirty = hasMemberChanges(original, values, member?.horizontalRelations ?? [], relations);
  const disablePrevention = usePreventRemove(status === 'authenticated' && !allowLeave && (dirty || saving), ({ repeat }) => {
    if (savingRef.current) { showToast(copy.saving); return; }
    Alert.alert(copy.discardTitle, copy.discardMessage, [{ text: copy.cancel, style: 'cancel' }, { text: copy.discard, style: 'destructive', onPress: () => { setAllowLeave(true); repeat(); } }]);
  });
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    void Promise.all([familyDataApi.list(controller.signal), familyApi.generations(controller.signal).catch(() => [])]).then(([list, metadata]) => {
      if (active) { setMembers(list); setGenerations(metadata); }
    }).catch((error: unknown) => { if (active) setRefsError(error); }).finally(() => { if (active) setLoadingRefs(false); });
    return () => { active = false; controller.abort(); };
  }, [member?.id, refsRevision]);
  const reloadRefs = () => { setLoadingRefs(true); setRefsError(undefined); setRefsRevision(value => value + 1); };
  const byId = useMemo(() => new Map(members.map(row => [String(row.id), row])), [members]);
  const siblings = member ? sharedParentSiblings(member, members) : [];
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues(previous => ({ ...previous, [key]: value })); setErrors(previous => ({ ...previous, [key]: undefined })); setNotice('');
  };
  const selected = picker === 'horizontal' ? [] : picker === 'childIds' ? values.childIds : picker ? values[picker] ? [values[picker]] : [] : [];
  const pickerTitle = picker === 'fatherId' ? copy.father : picker === 'motherId' ? copy.mother : picker === 'spouseId' ? copy.spouse : picker === 'childIds' ? copy.children : copy.horizontal;
  const applySelection = (ids: string[]) => {
    if (picker === 'horizontal') setRelations(previous => [...previous, ...ids.filter(id => !previous.some(row => row.memberId === Number(id) && row.relationType.toLowerCase() === 'sibling')).map(id => ({ memberId: Number(id), relationType: 'sibling' }))]);
    else if (picker === 'childIds') set('childIds', ids);
    else if (picker) set(picker, ids[0] ?? '');
    setPicker(undefined);
  };
  const save = async () => {
    if (savingRef.current || uncertainCreation) return;
    Keyboard.dismiss(); const validation = validateMemberEdit(values, relations, copy, member?.id);
    setErrors(validation); setNotice(''); setConflict(false);
    if (Object.keys(validation).length) return;
    savingRef.current = true; setSaving(true);
    let mutationStarted = false;
    try {
      let saved: FamilyMember;
      if (member) {
        const latest = await familyDataApi.get(member.id);
        const input = buildMemberUpdate(member, latest, values, relations);
        mutationStarted = true; saved = requireMember(await familyApi.update(member.id, input));
      } else {
        mutationStarted = true; saved = requireMember(await familyApi.create(buildMemberCreate(values, relations) as Parameters<typeof familyApi.create>[0]));
      }
      // The successful mutation response is authoritative even if the follow-up
      // read loses connectivity. Navigate to its profile, whose read is retryable.
      const authoritative = await familyDataApi.get(saved.id).catch(() => saved);
      if (alive.current) { setAllowLeave(true); disablePrevention(); showToast(copy.saved, 'success'); onSaved(authoritative); }
    } catch (error) {
      if (alive.current) {
        if (!member && mutationStarted && (error as { kind?: string })?.kind === 'network') { setUncertainCreation(true); setNotice(copy.createUncertain); }
        else setNotice(familyError(error, copy));
        setErrors(localizedFieldErrors(error, copy)); setConflict(error instanceof MemberConflict);
      }
    } finally { savingRef.current = false; if (alive.current) setSaving(false); }
  };
  const relationLabel = (id: string) => byId.get(id)?.fullName || (id ? copy.selectedMissing(id) : copy.noRelations);
  const selectField = (label: string, field: Exclude<RelationField, 'horizontal'>) => {
    const ids = field === 'childIds' ? values.childIds : values[field] ? [values[field]] : [];
    return <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${ids.map(relationLabel).join(', ') || copy.noRelations}`} accessibilityState={{ disabled: saving }} disabled={saving} onPress={() => setPicker(field)}
      style={[styles.select, { backgroundColor: colors.surfaceElevated, borderColor: errors[field] ? colors.error : colors.controlBorder }]}>
      <AppText variant="label">{label}</AppText><AppText tone="secondary">{ids.map(relationLabel).join(' · ') || copy.noRelations}</AppText>
      {errors[field] ? <AppText accessibilityRole="alert" accessibilityLiveRegion="polite" tone="error">{errors[field]}</AppText> : null}
    </Pressable>;
  };
  const choice = (label: string, active: boolean, onPress: () => void) => <Pressable key={label} accessibilityRole="button" accessibilityState={{ selected: active, disabled: saving }} disabled={saving} onPress={onPress}
    style={[styles.chip, { backgroundColor: active ? colors.accentFamily : colors.surface, borderColor: colors.controlBorder }]}><AppText style={{ color: active ? colors.onAccent : colors.textPrimary }}>{label}</AppText></Pressable>;
  const text = (label: string, key: keyof FormValues, keyboardType?: 'phone-pad' | 'numeric' | 'url', maxLength?: number, multiline = false) => {
    const value = values[key]; if (typeof value !== 'string') return null;
    const props = { label, value, disabled: saving, onChangeText: (next: string) => set(key, next), error: errors[key], maxLength, keyboardType,
      autoCapitalize: key === 'facebookUrl' || key === 'instagramUrl' ? 'none' as const : 'sentences' as const,
      helperText: key === 'dateOfBirth' || key === 'deathDate' ? copy.dateHint : undefined };
    return multiline ? <MyLifeTextArea {...props} /> : <MyLifeTextField {...props} />;
  };
  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets contentContainerStyle={styles.content}>
      <View style={styles.form}>
        <AppText variant="sectionTitle" accessibilityRole="header">{copy.basic}</AppText>
        {text(`${copy.fullName} *`, 'fullName', undefined, 100)}
        <MyLifeTextField label={`${copy.generation} *`} value={values.generation} disabled={saving} onChangeText={value => set('generation', value.replace(/[^0-9]/g, ''))} keyboardType="numeric" error={errors.generation} helperText={generations.map(row => row.title || row.name).join(' · ')} maxLength={10} />
        <AppText variant="label">{copy.gender}</AppText><View style={styles.chips}>{choice(copy.unknown, !values.gender, () => set('gender', ''))}{choice(copy.male, normalizeGender(values.gender) === 'male', () => set('gender', 'male'))}{choice(copy.female, normalizeGender(values.gender) === 'female', () => set('gender', 'female'))}{choice(copy.other, normalizeGender(values.gender) === 'other', () => set('gender', 'other'))}</View>
        {values.gender && normalizeGender(values.gender) === 'unknown' ? text(copy.gender, 'gender', undefined, 20) : null}
        {text(copy.birth, 'dateOfBirth')}
        <AppText variant="label">{copy.lifeStatus}</AppText><View style={styles.chips}>{choice(copy.living, values.lifeStatus === 'LIVING', () => { set('lifeStatus', 'LIVING'); set('deathDate', ''); })}{choice(copy.deceased, values.lifeStatus === 'DECEASED', () => set('lifeStatus', 'DECEASED'))}</View>
        {values.lifeStatus === 'DECEASED' ? text(`${copy.death} *`, 'deathDate') : null}
        {text(copy.role, 'role', undefined, 50)}{text(copy.phone, 'phoneNumber', 'phone-pad', 20)}{text(copy.address, 'address', undefined, 255)}
        {text(copy.facebook, 'facebookUrl', 'url', 255)}{text(copy.instagram, 'instagramUrl', 'url', 255)}
        <AppText variant="sectionTitle" accessibilityRole="header">{copy.relations}</AppText>
        {refsError ? <ErrorState title={copy.loadError} message={familyError(refsError, copy)} retry={reloadRefs} /> : null}
        {selectField(copy.father, 'fatherId')}{selectField(copy.mother, 'motherId')}{selectField(copy.spouse, 'spouseId')}{selectField(copy.children, 'childIds')}
        <AppText variant="caption" tone="secondary">{copy.childrenHint} {copy.childParentLabel(['female', 'nữ'].includes((values.gender ?? '').toLowerCase()) ? copy.mother : copy.father)}</AppText>
        <AppCard inset style={styles.group}><AppText variant="cardTitle">{copy.horizontal}</AppText><AppText variant="caption" tone="secondary">{copy.explicitHint}</AppText>
          {relations.map((row, index) => <View key={`${row.memberId}:${index}`} style={styles.group}>
            <AppText variant="bodyMedium">{relationLabel(String(row.memberId))}</AppText>
            <View style={styles.chips}>{choice(copy.sibling, row.relationType.trim().toLowerCase() === 'sibling', () => setRelations(previous => previous.map((value, at) => at === index ? { ...value, relationType: 'sibling' } : value)))}{choice(copy.cousin, row.relationType.trim().toLowerCase() === 'cousin', () => setRelations(previous => previous.map((value, at) => at === index ? { ...value, relationType: 'cousin' } : value)))}</View>
            <MyLifeTextField label={copy.relationType} value={row.relationType} disabled={saving} maxLength={50} helperText={copy.relationTypeHint} onChangeText={relationType => setRelations(previous => previous.map((value, at) => at === index ? { ...value, relationType } : value))} />
            <TextButton title={copy.removeRelation} disabled={saving} onPress={() => Alert.alert(copy.removeLinksTitle, copy.removeLinksMessage, [{ text: copy.cancel, style: 'cancel' }, { text: copy.confirm, onPress: () => setRelations(previous => previous.filter((_, at) => at !== index)) }])} />
          </View>)}
          <SecondaryButton title={copy.addRelation} disabled={saving} onPress={() => setPicker('horizontal')} />
        </AppCard>
        {siblings.length ? <AppCard inset style={styles.group}><AppText variant="cardTitle">{copy.inferredSiblings}</AppText><AppText tone="secondary">{siblings.map(row => row.fullName).join(' · ')}</AppText><AppText variant="caption" tone="secondary">{copy.inferredHint}</AppText></AppCard> : null}
        {text(copy.biography, 'biography', undefined, undefined, true)}
        {errors.form ? <AppText accessibilityRole="alert" accessibilityLiveRegion="polite" tone="error">{errors.form}</AppText> : null}
        {notice ? <AppText accessibilityRole="alert" accessibilityLiveRegion="polite" tone="error">{notice}</AppText> : null}
        {conflict && onReload ? <SecondaryButton title={copy.reload} disabled={saving} onPress={() => Alert.alert(copy.discardTitle, copy.discardMessage, [{ text: copy.cancel, style: 'cancel' }, { text: copy.reload, onPress: () => { disablePrevention(); setAllowLeave(true); onReload(); } }])} /> : null}
        {uncertainCreation ? <SecondaryButton title={copy.viewFamily} onPress={() => { disablePrevention(); setAllowLeave(true); onCancel(); }} /> : null}
        <PrimaryButton title={copy.save} loading={saving} disabled={uncertainCreation} onPress={() => void save()} />
        <SecondaryButton title={copy.cancel} onPress={onCancel} disabled={saving} />
      </View>
    </ScrollView>
    {picker ? <RelationshipPicker key={picker} title={pickerTitle} members={members} selected={selected} selfId={member?.id} multiple={picker === 'childIds' || picker === 'horizontal'} loading={loadingRefs} error={refsError ? familyError(refsError, copy) : undefined} onRetry={reloadRefs} onCancel={() => setPicker(undefined)} onConfirm={applySelection} /> : null}
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({ flex: { flex: 1 }, content: { padding: spacing.lg, paddingBottom: spacing.xxxl }, form: { width: '100%', maxWidth: 620, alignSelf: 'center', gap: spacing.md }, group: { gap: spacing.sm }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }, chip: { minHeight: 48, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, justifyContent: 'center', borderWidth: 1, borderRadius: 16 }, select: { minHeight: 64, borderWidth: 1, borderRadius: 15, padding: spacing.md, gap: spacing.xs } });
