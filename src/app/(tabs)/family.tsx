import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen, LargeTitleHeader } from '@/components/layout/app-screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/states';
import { PrimaryButton, TextButton } from '@/design-system/components/buttons';
import { AppText } from '@/design-system/components/app-text';
import { ChipRow, FilterChip, SegmentedTabs } from '@/design-system/components/controls';
import { MyLifeSearchField } from '@/design-system/components/fields';
import { spacing } from '@/design-system/tokens';
import { useAuth } from '@/features/auth/context/auth-provider';
import { familyDataApi } from '@/features/family/api/familyDataApi';
import { MemberCard } from '@/features/family/components/MemberCard';
import { FamilyGraph } from '@/features/family/components/FamilyGraph';
import { openMember } from '@/features/family/components/FamilyHeader';
import { useFamilyQuery } from '@/features/family/data/use-family-query';
import { emptyFilters, filterMembers, type MemberFilters } from '@/features/family/data/member-search';
import { familyError } from '@/features/family/data/family-errors';
import { useFamilyStrings } from '@/features/family/i18n/use-family-strings';
import type { FamilyMember } from '@/features/family/types/family';
import { useAppTheme } from '@/theme/theme-provider';
import { mapStrings } from '@/features/family/map/map-strings';

type Mode = 'cards' | 'list' | 'tree';
export default function FamilyScreen() {
  const { user, isUser } = useAuth(); const { copy } = useFamilyStrings();
  if (!user) return <AppScreen centered><LoadingState /></AppScreen>;
  if (!isUser) return <AppScreen><LargeTitleHeader title={copy.family} /><EmptyState title={copy.adminTitle} message={copy.adminMessage} /></AppScreen>;
  return <FamilyDirectory key={`${user.id}:${user.role}`} accountId={user.id} />;
}
function FamilyDirectory({ accountId }: { accountId: number }) {
  const { copy } = useFamilyStrings(); const { colors, language } = useAppTheme();
  const query = useFamilyQuery(accountId, 'members', familyDataApi.list);
  const [mode, setMode] = useState<Mode>('cards'); const [filters, setFilters] = useState<MemberFilters>(emptyFilters); const [showFilters, setShowFilters] = useState(false);
  const members = useMemo(() => query.data ?? [], [query.data]);
  const generations = useMemo(() => [...new Set(members.map(member => member.generation))].sort((a, b) => a - b), [members]);
  const visible = useMemo(() => filterMembers(members, filters), [members, filters]);
  const updateFilter = (key: keyof MemberFilters, value: string) => setFilters(previous => ({ ...previous, [key]: value }));
  const filtered = filters.query !== '' || filters.generation !== 'all' || filters.lifeStatus !== 'all' || filters.gender !== 'all';
  const renderMember = useCallback(({ item }: { item: FamilyMember }) => <MemberCard member={item} compact={mode === 'list'} onOpen={openMember} />, [mode]);
  const add = () => router.push('/family/new');
  const modes = <SegmentedTabs<Mode> value={mode} onChange={setMode} options={[{ value: 'cards', label: copy.cards }, { value: 'list', label: copy.list }, { value: 'tree', label: copy.tree }]} />;
  const errorOrEmpty = query.status === 'loading' && !query.data ? <LoadingState /> : query.status === 'error' ? <ErrorState title={copy.loadError} message={familyError(query.error, copy)} retry={() => void query.reload()} /> : !members.length ? <EmptyState title={copy.noMembers} message={copy.noMembersMessage} action={{ label: copy.add, onPress: add }} /> : <EmptyState title={copy.noResults} message={copy.noResultsMessage} action={{ label: copy.clearFilters, onPress: () => setFilters(emptyFilters) }} />;
  if (mode === 'tree') return <AppScreen padded={false}>
    <View style={styles.treeHeader}><AppText variant="sectionTitle" accessibilityRole="header">{copy.family}</AppText>{modes}<TextButton title={mapStrings[language].title} onPress={() => router.push('/family/map')} /><TextButton title={copy.retry} onPress={() => void query.reload()} /></View>
    {members.length ? <FamilyGraph members={members} onOpen={openMember} /> : errorOrEmpty}
  </AppScreen>;
  return <AppScreen padded={false}>
    <FlatList data={visible} keyExtractor={member => String(member.id)} renderItem={renderMember} initialNumToRender={12} maxToRenderPerBatch={12} windowSize={5}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={query.status === 'loading'} onRefresh={() => void query.reload()} tintColor={colors.accentFamily} colors={[colors.accentFamily]} />}
      ListHeaderComponent={<View style={styles.header}>
        <LargeTitleHeader title={copy.family} eyebrow={copy.eyebrow} subtitle={copy.subtitle} />{modes}
        {query.data ? <AppText tone="secondary">{copy.members(members.length)} · {copy.generations(generations.length)}</AppText> : null}
        <PrimaryButton title={copy.add} onPress={add} />
        <TextButton title={mapStrings[language].title} onPress={() => router.push('/family/map')} />
        <MyLifeSearchField accessibilityLabel={copy.search} placeholder={copy.search} value={filters.query} onChangeText={value => updateFilter('query', value)} />
        <View style={styles.filterActions}><TextButton style={styles.filterButton} title={copy.filters} onPress={() => setShowFilters(value => !value)} accessibilityState={{ expanded: showFilters }} /><TextButton style={styles.filterButton} title={copy.clearFilters} onPress={() => setFilters(emptyFilters)} disabled={!filtered} /></View>
        {showFilters ? <View style={styles.header}>
          <AppText variant="label">{copy.generation}</AppText><ChipRow><FilterChip label={copy.all} selected={filters.generation === 'all'} onPress={() => updateFilter('generation', 'all')} />{generations.map(value => <FilterChip key={value} label={copy.generationValue(value)} selected={filters.generation === String(value)} onPress={() => updateFilter('generation', String(value))} />)}</ChipRow>
          <AppText variant="label">{copy.lifeStatus}</AppText><ChipRow>{[{ value: 'all', label: copy.all }, { value: 'LIVING', label: copy.living }, { value: 'DECEASED', label: copy.deceased }].map(value => <FilterChip key={value.value} label={value.label} selected={filters.lifeStatus === value.value} onPress={() => updateFilter('lifeStatus', value.value)} />)}</ChipRow>
          <AppText variant="label">{copy.gender}</AppText><ChipRow>{[{ value: 'all', label: copy.all }, { value: 'male', label: copy.male }, { value: 'female', label: copy.female }, { value: 'other', label: copy.other }, { value: 'unknown', label: copy.unknown }].map(value => <FilterChip key={value.value} label={value.label} selected={filters.gender === value.value} onPress={() => updateFilter('gender', value.value)} />)}</ChipRow>
        </View> : null}
      </View>}
      ListEmptyComponent={errorOrEmpty} ItemSeparatorComponent={Separator} />
  </AppScreen>;
}
function Separator() { return <View style={{ height: spacing.sm }} />; }
const styles = StyleSheet.create({ list: { padding: spacing.lg, paddingBottom: spacing.xxxl, width: '100%', maxWidth: 760, alignSelf: 'center' }, header: { gap: spacing.sm, marginBottom: spacing.md }, treeHeader: { padding: spacing.sm, gap: spacing.xs }, filterActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs }, filterButton: { flexGrow: 1, flexBasis: 140, minWidth: 0 } });
