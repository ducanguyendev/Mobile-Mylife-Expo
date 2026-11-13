import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AppState, FlatList, RefreshControl, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { AppHeader, AppScreen } from '@/components/layout/app-screen';
import { LoadingState } from '@/components/feedback/states';
import { AppText } from '@/design-system/components/app-text';
import { AppCard } from '@/design-system/components/surfaces';
import { Badge } from '@/design-system/components/controls';
import { MyLifeSearchField } from '@/design-system/components/fields';
import { PrimaryButton, SecondaryButton, TextButton } from '@/design-system/components/buttons';
import { useAuth } from '@/features/auth/context/auth-provider';
import { useDeviceClock } from '@/features/home/use-home';
import { vietnamDateKey } from '@/features/home/home-data';
import { memberIdValid, positiveId } from '@/features/timeline/timeline-data';
import { useAppTheme } from '@/theme/theme-provider';
import { anniversaryApi, createAnniversaryMutations } from './anniversary-api';
import { blankAnniversary, selectAnniversaries, type Anniversary, type AnniversaryFilter, type AnniversaryWrite } from './anniversary-data';
import { calendarMonthValid, dateMonth, type CalendarMonth } from './calendar-data';
import { anniversaryError, anniversaryStrings, anniversaryTypeLabel, countdownLabel, solarDateLabel } from './anniversary-strings';
import { useAnniversaries } from './use-anniversaries';
import { AnniversaryCalendar } from './AnniversaryCalendar';
import { AnniversaryEditor } from './AnniversaryEditor';
import { AnniversaryDeleteDialog, AnniversaryDetails } from './AnniversaryDetails';

type Props = { memberId?: number; anniversaryId?: number; canGoBack?: boolean; onTimeline?: () => void };
const emptyItems: Anniversary[] = [];
export function AnniversaryScreen(props: Props) {
  const { user, isUser } = useAuth();
  const { language } = useAppTheme();
  const copy = anniversaryStrings[language];
  if (!user || !isUser) return <AppScreen><AppText>{copy.forbidden}</AppText></AppScreen>;
  if (props.memberId !== undefined && !memberIdValid(props.memberId) || props.anniversaryId !== undefined && !positiveId(props.anniversaryId)) {
    return <AppScreen><TextButton title={copy.close} onPress={() => router.back()} /><AppText tone="error">{copy.invalidData}</AppText></AppScreen>;
  }
  return <AnniversaryExplorer key={`${user.id}:${user.role}:${props.memberId ?? 'all'}:${props.anniversaryId ?? 'list'}`} accountId={user.id} {...props} />;
}
function AnniversaryExplorer({ accountId, memberId, anniversaryId, canGoBack, onTimeline }: Props & { accountId: number }) {
  const { colors, language } = useAppTheme();
  const copy = anniversaryStrings[language];
  const today = vietnamDateKey(useDeviceClock());
  const query = useAnniversaries(accountId, today, memberId);
  const [mutations] = useState(() => createAnniversaryMutations());
  const mutation = useSyncExternalStore(mutations.subscribe, mutations.getSnapshot, mutations.getSnapshot);
  const active = useRef(false);
  const operation = useRef<AbortController | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AnniversaryFilter>('ALL');
  const [date, setDate] = useState<string | null>(null);
  const [month, setMonth] = useState<CalendarMonth>(() => dateMonth(today));
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [library, setLibrary] = useState(false);
  const [details, setDetails] = useState<Anniversary>();
  const [editor, setEditor] = useState<{ original: Anniversary | null; initial: AnniversaryWrite }>();
  const [deleting, setDeleting] = useState<Anniversary>();
  const [message, setMessage] = useState('');
  const [requestError, setRequestError] = useState<unknown>();
  const openDetails = useCallback(async (id: number) => {
    if (!active.current || operation.current) return;
    const controller = new AbortController();
    operation.current = controller;
    setRequestError(undefined);
    try {
      const item = await anniversaryApi.get(id, controller.signal);
      if (active.current && !controller.signal.aborted) setDetails(item);
    } catch (error) { if (active.current && !controller.signal.aborted) setRequestError(error); }
    finally { if (operation.current === controller) operation.current = null; }
  }, []);
  useFocusEffect(useCallback(() => {
    active.current = AppState.currentState === 'active';
    mutations.setActive(active.current);
    const cancel = () => {
      operation.current?.abort();
      operation.current = null;
      setDetails(undefined);
      setEditor(undefined);
      setDeleting(undefined);
    };
    if (anniversaryId && active.current) void openDetails(anniversaryId);
    const subscription = AppState.addEventListener('change', next => {
      active.current = next === 'active';
      mutations.setActive(active.current);
      if (!active.current) cancel();
    });
    return () => {
      active.current = false;
      mutations.setActive(false);
      subscription.remove();
      cancel();
    };
  }, [anniversaryId, mutations, openDetails]));
  const items = query.data?.items ?? emptyItems;
  const scoped = useMemo(() => memberId === undefined ? items : items.filter(item => item.relatedMemberId === memberId), [items, memberId]);
  const visible = useMemo(() => selectAnniversaries(scoped, filter, search, date), [scoped, filter, search, date]);
  const calendarItems = useMemo(() => selectAnniversaries(scoped, filter, search, null), [scoped, filter, search]);
  const refresh = async () => {
    if (!active.current || operation.current || mutation.busy) return;
    const controller = new AbortController();
    operation.current = controller;
    setMessage('');
    setRequestError(undefined);
    try {
      if (mutation.needsReconcile) await mutations.reconcile(controller.signal);
      if (active.current && !controller.signal.aborted) await query.reload();
    } catch (error) { if (active.current && !controller.signal.aborted) setRequestError(error); }
    finally { if (operation.current === controller) operation.current = null; }
  };
  const save = async (values: AnniversaryWrite) => {
    if (!editor || operation.current || !active.current) throw new Error('ANNIVERSARY_RECONCILE');
    const controller = new AbortController();
    operation.current = controller;
    try {
      const rows = await mutations.save(editor.original, values, controller.signal);
      if (active.current && !controller.signal.aborted) {
        const saved = rows.find(item => item.eventType === values.eventType && item.title === values.title && item.relatedMemberId === values.relatedMemberId && item.originalSolarDate === values.originalSolarDate);
        if (saved && calendarMonthValid(dateMonth(saved.nextSolarDate))) setMonth(dateMonth(saved.nextSolarDate));
        setDate(null);
        setEditor(undefined);
        setMessage(copy.saved);
        await query.reload();
      }
    } finally { if (operation.current === controller) operation.current = null; }
  };
  const remove = async () => {
    if (!deleting || operation.current || !active.current) return;
    const controller = new AbortController();
    operation.current = controller;
    setRequestError(undefined);
    try {
      await mutations.remove(deleting, controller.signal);
      if (active.current && !controller.signal.aborted) {
        setDeleting(undefined);
        setMessage(copy.removed);
        await query.reload();
      }
    } catch (error) { if (active.current && !controller.signal.aborted) setRequestError(error); }
    finally { if (operation.current === controller) operation.current = null; }
  };
  const members = query.data?.members ?? [];
  const unavailable = mutation.busy || mutation.needsReconcile || !query.data;
  const feedback = requestError ? anniversaryError(requestError, copy) : '';
  const emptyTitle = !scoped.length ? copy.empty
    : date && !scoped.some(item => item.nextSolarDate === date) ? copy.noDayEvents : copy.noResults;
  const header = <View style={{ gap: 16 }}>
    {canGoBack ? <TextButton title={copy.close} onPress={() => router.back()} /> : null}
    <AppHeader eyebrow={copy.memories} title={memberId === undefined ? copy.title : copy.memberCalendar}
      subtitle={memberId === undefined ? copy.subtitle : members.find(member => member.id === memberId)?.fullName} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <SecondaryButton title={copy.timeline} style={{ flexBasis: 140, flexGrow: 1 }} onPress={() => {
        if (onTimeline) onTimeline();
        else router.push({ pathname: '/family/timeline', params: memberId ? { memberId: String(memberId) } : {} });
      }} />
      <SecondaryButton title={copy.calendar} style={{ flexBasis: 140, flexGrow: 1 }} accessibilityState={{ selected: !library }} onPress={() => setLibrary(false)} />
      <SecondaryButton title={copy.library} style={{ flexBasis: 140, flexGrow: 1 }} accessibilityState={{ selected: library }} onPress={() => setLibrary(true)} />
    </View>
    {library ? <AppCard inset><AppText>{copy.future}</AppText></AppCard> : <>
      <PrimaryButton title={copy.add} disabled={unavailable} onPress={() => {
        setMessage('');
        setRequestError(undefined);
        setEditor({ original: null, initial: blankAnniversary(memberId ?? null) });
      }} />
      <MyLifeSearchField accessibilityLabel={copy.search} placeholder={copy.search} value={search} onChangeText={setSearch} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(['ALL', 'DEATH_ANNIVERSARY', 'FAMILY_EVENT'] as const).map(type => <SecondaryButton key={type}
          title={type === 'ALL' ? copy.all : anniversaryTypeLabel(type, copy)} accessibilityState={{ selected: filter === type }}
          style={{ flexBasis: 130, flexGrow: 1, borderWidth: filter === type ? 3 : 1 }} onPress={() => setFilter(type)} />)}
      </View>
      <TextButton title={copy.clear} onPress={() => { setSearch(''); setFilter('ALL'); setDate(null); }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <SecondaryButton title={copy.grid} accessibilityState={{ selected: view === 'grid' }} onPress={() => setView('grid')} />
        <SecondaryButton title={copy.list} accessibilityState={{ selected: view === 'list' }} onPress={() => setView('list')} />
      </View>
      {view === 'grid' ? <AnniversaryCalendar items={calendarItems} month={month} today={today} selected={date} copy={copy}
        onMonth={value => { setMonth(value); setDate(null); }} onSelect={setDate} /> : date ? <AppText>{copy.selectedDate} {solarDateLabel(date, language, copy)}</AppText> : null}
      <SecondaryButton title={copy.refresh} disabled={mutation.busy || query.status === 'loading'} onPress={() => void refresh()} />
      <AppText variant="sectionTitle" accessibilityRole="header">{copy.upcoming}</AppText>
      <AppText>{copy.count} {visible.length}/{scoped.length}</AppText>
      {query.status === 'loading' ? <LoadingState /> : null}
      {query.status === 'error' ? <AppText accessibilityRole="alert" tone="error">{copy.loadError}</AppText> : null}
      {feedback ? <AppText accessibilityRole="alert" tone="error">{feedback}</AppText> : null}
      {mutation.needsReconcile ? <AppText accessibilityRole="alert" tone="error">{copy.uncertain}</AppText> : null}
      {message ? <AppText accessibilityLiveRegion="polite">{message}</AppText> : null}
    </>}
  </View>;
  return <AppScreen padded={false}>
    <FlatList data={library ? emptyItems : visible} keyExtractor={item => String(item.id)} initialNumToRender={10}
      maxToRenderPerBatch={10} windowSize={5} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48, width: '100%', maxWidth: 760, alignSelf: 'center' }}
      refreshControl={<RefreshControl refreshing={query.status === 'loading'} onRefresh={() => void refresh()} tintColor={colors.accentFamily} />}
      ListHeaderComponent={header} ListEmptyComponent={!library && query.status === 'ready' ? <AppCard inset>
        <AppText variant="cardTitle">{emptyTitle}</AppText>
        {!scoped.length ? <AppText>{copy.emptyHint}</AppText> : null}
      </AppCard> : undefined}
      renderItem={({ item }) => <AppCard inset style={{ gap: 10, borderLeftWidth: 3, borderLeftColor: item.eventType === 'DEATH_ANNIVERSARY' ? colors.accentAnniversary : colors.accentFamily }}>
        <Badge label={anniversaryTypeLabel(item.eventType, copy)} />
        <AppText variant="cardTitle">{item.title}</AppText>
        {item.relatedMemberName ? <AppText>{item.relatedMemberName}</AppText> : null}
        <AppText>{solarDateLabel(item.nextSolarDate, language, copy)}</AppText>
        <AppText variant="label">{countdownLabel(item, language, copy)}</AppText>
        {item.eventType === 'DEATH_ANNIVERSARY' ? <AppText>{copy.day} {item.lunarDay}/{item.lunarMonth}{item.isLeapMonth ? ` · ${copy.leap}` : ''}</AppText> : null}
        {item.place ? <AppText>{item.place}</AppText> : null}
        {item.host ? <AppText>{item.host}</AppText> : null}
        <TextButton title={copy.details} accessibilityLabel={`${copy.details} ${item.title}`} onPress={() => void openDetails(item.id)} />
      </AppCard>} />
    {details ? <AnniversaryDetails item={details} copy={copy} disabled={unavailable} onClose={() => setDetails(undefined)}
      onEdit={() => { setEditor({ original: details, initial: blankAnniversary() }); setDetails(undefined); }}
      onDelete={() => { setDeleting(details); setDetails(undefined); setRequestError(undefined); }} /> : null}
    {editor ? <AnniversaryEditor original={editor.original} initial={editor.initial} members={members} copy={copy}
      busy={mutation.busy} needsReconcile={mutation.needsReconcile} onCancel={() => setEditor(undefined)} onSave={save} /> : null}
    {deleting ? <AnniversaryDeleteDialog item={deleting} copy={copy} busy={mutation.busy} needsReconcile={mutation.needsReconcile}
      error={mutation.needsReconcile ? copy.uncertain : feedback} onCancel={() => setDeleting(undefined)} onConfirm={() => void remove()} /> : null}
  </AppScreen>;
}
