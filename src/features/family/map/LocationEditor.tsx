import { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/design-system/components/app-text';
import { MyLifeTextField } from '@/design-system/components/fields';
import { PrimaryButton, SecondaryButton } from '@/design-system/components/buttons';
import { useAppTheme } from '@/theme/theme-provider';
import type { FamilyMember } from '../types/family';
import { FamilyNativeMap } from './FamilyNativeMap';
import { LocationConflict, validPoint, type Point } from './map-data';
import { saveManualLocation } from './map-api';
import type { MapCopy } from './map-strings';

export function LocationEditor({ member, copy, onClose, onSaved, isCurrent }: { member: FamilyMember; copy: MapCopy; onClose: () => void; onSaved: () => void; isCurrent: () => boolean }) {
  const { colors } = useAppTheme(); const controller = useRef(new AbortController()); const busy = useRef(false);
  const [latitude, setLatitude] = useState(''); const [longitude, setLongitude] = useState(''); const [name, setName] = useState('');
  const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [conflict, setConflict] = useState(false);
  const saved = member.locationStatus === 'LOCATED' && member.latitude !== null && member.longitude !== null ? { latitude: member.latitude, longitude: member.longitude } : null;
  const numeric = (s: string) => s.trim() && /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(s.trim()) ? Number(s.replace(',', '.')) : NaN;
  const point = { latitude: numeric(latitude), longitude: numeric(longitude) }; const valid = validPoint(point) && name.length <= 500;
  useEffect(() => { const operation = controller.current; return () => operation.abort(); }, []);
  const close = () => { controller.current.abort(); onClose(); };
  const pick = (p: Point) => { setLatitude(String(p.latitude)); setLongitude(String(p.longitude)); setError(''); };
  const save = async () => {
    if (busy.current || conflict) return;
    if (!valid) { setError(copy.invalid); return; }
    busy.current = true; setSaving(true); setError('');
    try { await saveManualLocation(member, { ...point, displayName: name }, controller.current.signal, isCurrent); if (!controller.current.signal.aborted && isCurrent()) onSaved(); }
    catch (e) { if (!controller.current.signal.aborted) { if (e instanceof LocationConflict) { setConflict(true); setError(copy.conflict); } else setError(copy.error); } }
    finally { busy.current = false; if (!controller.current.signal.aborted) setSaving(false); }
  };
  return <Modal visible animationType="none" onRequestClose={close} presentationStyle="fullScreen"><SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 16, maxWidth: 760, width: '100%', alignSelf: 'center' }}>
      <AppText accessibilityRole="header" variant="sectionTitle">{copy.editor}</AppText><AppText>{member.fullName}</AppText><AppText tone="secondary">{member.address || copy.noAddress}</AppText>
      <AppText selectable>{copy.saved}: {saved ? `${saved.latitude}, ${saved.longitude}` : copy.none} · {copy.source}: {member.locationSource === 'MANUAL' ? copy.manual : member.locationSource === 'GEOCODED' ? copy.geocoded : copy.none}</AppText>
      <AppText>{copy.tap}</AppText>
      <FamilyNativeMap copy={copy} locations={[]} saved={saved} pending={valid ? point : null} onPick={saving || conflict ? undefined : pick} />
      <MyLifeTextField label={copy.latitude} value={latitude} onChangeText={setLatitude} keyboardType="numbers-and-punctuation" disabled={saving || conflict} />
      <MyLifeTextField label={copy.longitude} value={longitude} onChangeText={setLongitude} keyboardType="numbers-and-punctuation" disabled={saving || conflict} />
      <MyLifeTextField label={copy.name} value={name} onChangeText={setName} maxLength={500} disabled={saving || conflict} />
      <AppText accessibilityLiveRegion="polite" selectable>{copy.pending}: {valid ? `${point.latitude}, ${point.longitude}${name ? ` · ${name}` : ''}` : copy.none}</AppText>
      {error ? <AppText accessibilityRole="alert" tone="error">{error}</AppText> : null}
      <PrimaryButton title={copy.save} onPress={() => void save()} disabled={!valid || conflict} loading={saving} /><SecondaryButton title={copy.close} onPress={close} />
      <View style={{ height: 16 }} />
    </ScrollView>
  </SafeAreaView></Modal>;
}
