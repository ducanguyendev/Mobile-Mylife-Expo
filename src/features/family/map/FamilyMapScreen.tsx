import { useCallback, useMemo, useRef, useState } from 'react';
import { AppState, FlatList, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AppScreen } from '@/components/layout/app-screen';
import { LoadingState } from '@/components/feedback/states';
import { AppText } from '@/design-system/components/app-text';
import { PrimaryButton, SecondaryButton, TextButton } from '@/design-system/components/buttons';
import { MyLifeSearchField } from '@/design-system/components/fields';
import { SegmentedTabs } from '@/design-system/components/controls';
import { AppCard } from '@/design-system/components/surfaces';
import { useAuth } from '@/features/auth/context/auth-provider';
import { useAppTheme } from '@/theme/theme-provider';
import { familyDataApi } from '../api/familyDataApi';
import { FamilyHeader, openMember } from '../components/FamilyHeader';
import type { FamilyMember } from '../types/family';
import { exploreMap, type MapFilter, type MapLocation, type MapMember } from './map-data';
import { familyMapApi } from './map-api';
import { mapStrings } from './map-strings';
import { useMapQuery } from './use-map-query';
import { FamilyNativeMap } from './FamilyNativeMap';
import { LocationEditor } from './LocationEditor';

export function FamilyMapScreen() {
  const { user, isUser } = useAuth();
  if (!user || !isUser) return null;
  return <MapExplorer key={`${user.id}:${user.role}`} accountId={user.id} />;
}
type Row = { key: string; group?: MapLocation; member?: MapMember; heading?: string };
function MapExplorer({ accountId }: { accountId: number }) {
  const { language } = useAppTheme(); const copy = mapStrings[language]; const query = useMapQuery(accountId);
  const params = useLocalSearchParams<{ memberId?: string }>(); const [search, setSearch] = useState(''); const [filter, setFilter] = useState<MapFilter>('all');
  const [selectedKey, setSelectedKey] = useState<string>(); const [selectedMember, setSelectedMember] = useState<number>();
  const [editor, setEditor] = useState<FamilyMember>(); const [working, setWorking] = useState(false); const [message, setMessage] = useState('');
  const request = useRef<AbortController | null>(null); const active = useRef(false); const [lastParam, setLastParam] = useState<string>();
  useFocusEffect(useCallback(() => {
    active.current = AppState.currentState === 'active';
    const cancel = () => { request.current?.abort(); request.current = null; setWorking(false); setEditor(undefined); };
    const subscription = AppState.addEventListener('change', state => { active.current = state === 'active'; if (!active.current) cancel(); });
    return () => { active.current = false; subscription.remove(); cancel(); };
  }, []));
  const data = query.data;
  // Profile-to-map selection is applied once per explicit navigation parameter.
  const requested = params.memberId && data?.members.find(m => String(m.id) === params.memberId);
  const effectiveKey = requested && lastParam !== params.memberId ? data?.locations.find(l => l.members.some(m => m.id === requested.id))?.key : selectedKey;
  const visible = useMemo(() => data ? exploreMap(data, search, filter) : { locations: [], unlocated: [], visibleMembers: 0 }, [data, search, filter]);
  const selected = visible.locations.find(l => l.key === effectiveKey);
  const rows = useMemo(() => {
    const result: Row[] = [];
    if (selected) { result.push({ key: 'selection', heading: `${copy.selected}: ${selected.displayName} · ${selected.memberCount} ${copy.people}` }); for (const m of selected.members) result.push({ key: `selected:${m.id}`, member: data!.members.find(row => row.id === m.id)! }); }
    result.push({ key: 'groups', heading: copy.groups }); visible.locations.forEach(group => result.push({ key: group.key, group }));
    result.push({ key: 'unlocated', heading: `${copy.unlocated} · ${visible.unlocated.length}` }); visible.unlocated.forEach(member => result.push({ key: `member:${member.id}`, member }));
    return result;
  }, [selected, data, visible, copy]);
  const select = (key: string) => { setLastParam(params.memberId); setSelectedKey(key); setSelectedMember(undefined); };
  const openEditor = async (id: number) => {
    if (request.current || !active.current) return;
    const operation = new AbortController(); request.current = operation; setWorking(true); setMessage(''); setSelectedMember(id);
    try { const member = await familyDataApi.get(id, operation.signal); if (!operation.signal.aborted && active.current) setEditor(member); }
    catch { if (!operation.signal.aborted) setMessage(copy.error); }
    finally { if (request.current === operation) { request.current = null; setWorking(false); } }
  };
  const retry = async () => {
    if (request.current || !active.current) return;
    const operation = new AbortController(); request.current = operation; setWorking(true); setMessage('');
    try { const r = await familyMapApi.retry(operation.signal); if (operation.signal.aborted) return; setMessage(`${copy.queued}: ${r.queued} · ${copy.skippedManual}: ${r.skippedManual} · ${copy.skippedLocated}: ${r.skippedLocated} · ${copy.noAddress}: ${r.noAddress}. ${copy.queueNote}`); await query.reload(); }
    catch { if (!operation.signal.aborted) setMessage(copy.error); }
    finally { if (request.current === operation) { request.current = null; setWorking(false); } }
  };
  return <AppScreen padded={false}><FamilyHeader title={copy.title} />
    <FlatList data={rows} keyExtractor={row => row.key} initialNumToRender={12} maxToRenderPerBatch={12} windowSize={5} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40, width: '100%', maxWidth: 760, alignSelf: 'center' }}
      ListHeaderComponent={<View style={{ gap: 12 }}>
        {data ? <AppText>{copy.located}: {data.locatedMembers}/{data.totalMembers} · {copy.groups}: {data.locations.length} · {copy.unlocated}: {data.unlocatedMembers}</AppText> : null}
        <MyLifeSearchField accessibilityLabel={copy.search} placeholder={copy.search} value={search} onChangeText={setSearch} />
        <SegmentedTabs<MapFilter> value={filter} onChange={setFilter} options={(['all', 'located', 'unlocated'] as const).map(value => ({ value, label: copy[value] }))} />
        <SecondaryButton title={copy.refresh} onPress={() => void query.reload()} disabled={query.status === 'loading'} />
        {query.status === 'loading' && !data ? <LoadingState /> : null}
        {query.status === 'error' ? <AppText accessibilityRole="alert" tone="error">{copy.error}</AppText> : null}
        {data ? <><FamilyNativeMap copy={copy} locations={visible.locations} selectedKey={effectiveKey} onSelect={select} />{!data.locations.length ? <AppText tone="secondary">{copy.noPins}</AppText> : null}<AppText tone="secondary">{copy.results}: {visible.visibleMembers}</AppText></> : null}
        {requested && requested.status !== 'LOCATED' && lastParam !== params.memberId ? <SecondaryButton title={`${copy.edit}: ${requested.fullName}`} disabled={working} onPress={() => void openEditor(requested.id)} /> : null}
        {data?.failedGeocodingMembers ? <SecondaryButton title={copy.retry} disabled={working} onPress={() => void retry()} /> : null}
        {message ? <AppText accessibilityLiveRegion="polite">{message}</AppText> : null}
        {data && !data.totalMembers ? <AppText>{copy.empty}</AppText> : data && !visible.visibleMembers ? <AppText>{copy.noResults}</AppText> : null}
      </View>}
      renderItem={({ item }) => item.heading ? <AppText variant="sectionTitle" accessibilityRole="header">{item.heading}</AppText> : item.group ? <AppCard>
        <TextButton title={`${item.group.displayName} · ${item.group.memberCount} ${copy.people}`} accessibilityState={{ selected: effectiveKey === item.group.key }} onPress={() => select(item.group!.key)} />
        <AppText selectable tone="secondary">{item.group.latitude}, {item.group.longitude}</AppText>
      </AppCard> : item.member ? <AppCard>
        <AppText variant="label">{item.member.fullName}</AppText><AppText tone="secondary">{item.member.address || copy.noAddress}</AppText>
        <AppText>{copy.states[item.member.status]}</AppText>
        {item.member.status === 'LOCATED' ? <AppText selectable>{item.member.latitude}, {item.member.longitude} · {item.member.locationSource === 'MANUAL' ? copy.manual : item.member.locationSource === 'GEOCODED' ? copy.geocoded : copy.none}</AppText> : null}
        <TextButton title={copy.profile} onPress={() => openMember(item.member!.id)} />
        <PrimaryButton title={copy.edit} loading={working && selectedMember === item.member.id} disabled={working} onPress={() => void openEditor(item.member!.id)} />
        <TextButton title={copy.editMember} onPress={() => router.push({ pathname: '/family/[id]/edit', params: { id: String(item.member!.id) } })} />
      </AppCard> : null} />
    {editor ? <LocationEditor key={editor.id} member={editor} copy={copy} isCurrent={() => active.current} onClose={() => setEditor(undefined)} onSaved={() => { setEditor(undefined); setMessage(copy.success); void query.reload(); }} /> : null}
  </AppScreen>;
}
