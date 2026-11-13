import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AppState, SectionList, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { AppScreen, AppHeader } from '@/components/layout/app-screen';
import { AppText } from '@/design-system/components/app-text';
import { AppCard } from '@/design-system/components/surfaces';
import { Badge } from '@/design-system/components/controls';
import { PrimaryButton, SecondaryButton, TextButton } from '@/design-system/components/buttons';
import { MyLifeSearchField } from '@/design-system/components/fields';
import { LoadingState } from '@/components/feedback/states';
import { useAuth } from '@/features/auth/context/auth-provider';
import { useAppTheme } from '@/theme/theme-provider';
import { createTimelineMutations } from './timeline-api';
import { blankWrite, defaultType, eventKey, filterTypes, groupEvents, selectEvents, writable, type TimelineEvent, type TimelineFilter, type TimelineWrite } from './timeline-data';
import { actionError, dateLabel, displayTitle, timelineStrings } from './timeline-strings';
import { useTimelineQuery } from './use-timeline-query';
import { TimelineEventEditor } from './TimelineEventEditor';
import { TimelineDeleteDialog, TimelineEventDetails } from './TimelineEventDetails';
import type { FamilyMember } from '@/features/family/types/family';
const emptyMembers: FamilyMember[] = [];
const emptyEvents: TimelineEvent[] = [];
export function TimelineScreen({ memberId, canGoBack = false, onCalendar }: { memberId?: number; canGoBack?: boolean; onCalendar?: () => void }) {
  const { user, isUser } = useAuth(); const { language } = useAppTheme();
  if (!user || !isUser) return <AppScreen><AppText>{timelineStrings[language].denied}</AppText></AppScreen>;
  return <TimelineExplorer key={`${user.id}:${user.role}:${memberId ?? 'all'}`} accountId={user.id} memberId={memberId} canGoBack={canGoBack} onCalendar={onCalendar} />;
}
function TimelineExplorer({ accountId, memberId, canGoBack, onCalendar }: { accountId: number; memberId?: number; canGoBack: boolean; onCalendar?: () => void }) {
  const { colors, language } = useAppTheme(); const copy = timelineStrings[language]; const query = useTimelineQuery(accountId, memberId);
  const active = useRef(false); const operation = useRef<AbortController | null>(null);
  const [mutations] = useState(() => createTimelineMutations()); const mutation = useSyncExternalStore(mutations.subscribe, mutations.getSnapshot, mutations.getSnapshot);
  const [filter, setFilter] = useState<TimelineFilter>('ALL'); const [search, setSearch] = useState(''); const [tab, setTab] = useState<'timeline' | 'calendar' | 'library'>('timeline');
  const [details, setDetails] = useState<TimelineEvent>(); const [editor, setEditor] = useState<{ original: TimelineEvent | null; initial: TimelineWrite }>(); const [deleting, setDeleting] = useState<TimelineEvent>(); const [message, setMessage] = useState('');
  useFocusEffect(useCallback(() => {
    active.current = AppState.currentState === 'active'; mutations.setActive(active.current); const cancel = () => { operation.current?.abort(); operation.current = null; setEditor(undefined); setDetails(undefined); setDeleting(undefined); };
    const sub = AppState.addEventListener('change', next => { active.current = next === 'active'; mutations.setActive(active.current); if (!active.current) cancel(); });
    return () => { active.current = false; mutations.setActive(false); sub.remove(); cancel(); };
  }, [mutations]));
  const members = query.data?.members ?? emptyMembers; const events = query.data?.events ?? emptyEvents;
  const names = useMemo(() => new Map(members.map(m => [m.id, m.fullName])), [members]);
  const visible = useMemo(() => selectEvents(events, filter, search, names), [events, filter, search, names]); const sections = useMemo(() => groupEvents(visible), [visible]); const createType = defaultType(filter);
  const refresh = async () => { if (operation.current || !active.current || mutation.busy) return; const controller = new AbortController(); operation.current = controller; setMessage(''); try { await mutations.reconcile(controller.signal); if (active.current && !controller.signal.aborted) await query.reload(); } catch { if (active.current && !controller.signal.aborted) setMessage(mutations.getSnapshot().needsReconcile ? copy.uncertain : copy.error); } finally { if (operation.current === controller) operation.current = null; } };
  const save = async (values: TimelineWrite) => { if (!editor || operation.current || !active.current) throw new Error('TIMELINE_RECONCILE'); const controller = new AbortController(); operation.current = controller; try { await mutations.save(editor.original, values, controller.signal); if (active.current && !controller.signal.aborted) { setEditor(undefined); setMessage(copy.saved); await query.reload(); } } finally { if (operation.current === controller) operation.current = null; } };
  const remove = async () => { if (!deleting || !writable(deleting) || operation.current || !active.current) return; const controller = new AbortController(); operation.current = controller; setMessage(''); try { await mutations.remove(deleting, controller.signal); if (active.current && !controller.signal.aborted) { setDeleting(undefined); setMessage(copy.removed); await query.reload(); } } catch (e) { if (active.current && !controller.signal.aborted) setMessage(actionError(e, copy, mutations.getSnapshot().needsReconcile)); } finally { if (operation.current === controller) operation.current = null; } };
  const title = (event: TimelineEvent) => displayTitle(event, copy, event.memberId ? names.get(event.memberId) : undefined);
  const header = <View style={{ gap: 16 }}>
    {memberId !== undefined || canGoBack ? <TextButton title={copy.close} onPress={() => router.back()} /> : null}
    <AppHeader eyebrow={copy.memories} title={memberId === undefined ? copy.title : copy.memberTimeline} subtitle={memberId === undefined ? copy.subtitle : names.get(memberId)} />
    {memberId === undefined ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{(['timeline', 'calendar', 'library'] as const).map(value => <SecondaryButton key={value} title={value === 'timeline' ? copy.title : value === 'calendar' ? copy.calendar : `${copy[value]} · ${copy.future}`} accessibilityState={{ selected: tab === value }} style={{ flexBasis: 140, flexGrow: 1 }} onPress={() => {
      if (value === 'calendar') {
        if (onCalendar) onCalendar();
        else router.push('/family/anniversaries');
      } else setTab(value);
    }} />)}</View> : null}
    {tab !== 'timeline' ? <AppCard inset><AppText variant="sectionTitle">{copy[tab]} · {copy.future}</AppText><AppText>{copy.futureHint}</AppText></AppCard> : <>
      <AppText>{copy.count}: {visible.length}/{events.length}</AppText><AppText variant="caption" tone="secondary">{copy.order}</AppText>
      <MyLifeSearchField accessibilityLabel={copy.search} placeholder={copy.search} value={search} onChangeText={setSearch} />
      <View accessibilityLabel={copy.clear} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{(Object.keys(filterTypes) as TimelineFilter[]).map(type => <SecondaryButton compact key={type} title={copy.filters[type]} accessibilityState={{ selected: type === filter }} style={{ flexBasis: 120, flexGrow: 1, borderWidth: filter === type ? 3 : 1 }} onPress={() => setFilter(type)} />)}</View>
      <TextButton title={copy.clear} onPress={() => { setFilter('ALL'); setSearch(''); }} /><SecondaryButton title={copy.refresh} disabled={mutation.busy || query.status === 'loading'} onPress={() => void refresh()} />
      {createType ? <PrimaryButton title={copy.add} disabled={mutation.busy || mutation.needsReconcile || !query.data} onPress={() => { setMessage(''); setEditor({ original: null, initial: blankWrite(memberId ?? null, createType) }); }} /> : <AppText tone="secondary">{filter === 'BIRTH' ? copy.birthDeathHint : copy.readOnly}</AppText>}
      {query.status === 'loading' ? <LoadingState /> : null}{query.status === 'error' ? <AppText accessibilityRole="alert" tone="error">{copy.error}</AppText> : null}
      {mutation.needsReconcile ? <AppText accessibilityRole="alert" tone="error">{copy.uncertain}</AppText> : null}{message ? <AppText accessibilityLiveRegion="polite">{message}</AppText> : null}
      {query.status === 'ready' && !visible.length ? <AppCard inset><AppText variant="cardTitle">{events.length ? copy.noResults : copy.empty}</AppText><AppText>{copy.emptyHint}</AppText></AppCard> : null}
    </>}
  </View>;
  return <AppScreen padded={false}><SectionList sections={tab === 'timeline' ? sections : []} keyExtractor={eventKey} initialNumToRender={10} maxToRenderPerBatch={10} windowSize={5} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" stickySectionHeadersEnabled contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48, width: '100%', maxWidth: 760, alignSelf: 'center' }} ListHeaderComponent={header}
    renderSectionHeader={({ section }) => <View style={{ paddingVertical: 12, backgroundColor: colors.background }}><AppText variant="sectionTitle" accessibilityRole="header">{section.year ?? copy.unknownDate}</AppText></View>}
    renderItem={({ item }) => <AppCard inset style={{ gap: 10, borderLeftWidth: 3, borderLeftColor: colors.accentTimeline }}>
      <AppText variant="caption" tone="secondary">{dateLabel(item, copy)}</AppText><Badge label={copy.types[item.eventType]} /><AppText variant="cardTitle">{title(item)}</AppText>
      {item.memberId || item.relatedMemberId ? <AppText>{[item.memberId ? names.get(item.memberId) ?? item.memberName ?? copy.unknownMember : null, item.relatedMemberId ? names.get(item.relatedMemberId) ?? copy.unknownMember : null].filter(Boolean).join(' · ')}</AppText> : null}
      {item.description ? <AppText tone="secondary" numberOfLines={3}>{item.description}</AppText> : null}{item.location ? <AppText tone="secondary">{item.location}</AppText> : null}
      {item.isDerived ? <AppText variant="caption">{copy.automatic}</AppText> : !writable(item) ? <AppText variant="caption">{copy.legacy}</AppText> : null}<TextButton title={copy.details} accessibilityLabel={`${copy.details}: ${title(item)}`} onPress={() => { setMessage(''); setDetails(item); }} />
    </AppCard>} />
    {details ? <TimelineEventDetails event={details} names={names} copy={copy} onClose={() => setDetails(undefined)} onEdit={() => { if (writable(details)) { setEditor({ original: details, initial: blankWrite() }); setDetails(undefined); } }} onDelete={() => { if (writable(details)) { setDeleting(details); setDetails(undefined); } }} /> : null}
    {editor ? <TimelineEventEditor original={editor.original} initial={editor.initial} members={members} copy={copy} busy={mutation.busy} needsReconcile={mutation.needsReconcile} onCancel={() => setEditor(undefined)} onSave={save} /> : null}
    {deleting ? <TimelineDeleteDialog event={deleting} title={title(deleting)} copy={copy} busy={mutation.busy} needsReconcile={mutation.needsReconcile} error={message || (mutation.needsReconcile ? copy.uncertain : '')} onCancel={() => setDeleting(undefined)} onConfirm={() => void remove()} /> : null}
  </AppScreen>;
}
