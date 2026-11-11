import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Linking, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen, SectionHeader } from '@/components/layout/app-screen';
import { ErrorState, LoadingState } from '@/components/feedback/states';
import { useToast } from '@/components/feedback/toast-provider';
import { AppText } from '@/design-system/components/app-text';
import { AppCard, ActionRow } from '@/design-system/components/surfaces';
import { Badge } from '@/design-system/components/controls';
import { DestructiveButton, PrimaryButton } from '@/design-system/components/buttons';
import { spacing } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';
import { formatDateOnly } from '@/features/home/home-data';
import { familyApi } from '../api/familyApi';
import { familyDataApi } from '../api/familyDataApi';
import { familyError } from '../data/family-errors';
import { normalizeGender, phoneUrl, safeSocialUrl, sharedParentSiblings } from '../data/member-search';
import { useFamilyQuery } from '../data/use-family-query';
import { useFamilyStrings } from '../i18n/use-family-strings';
import type { FamilyMember } from '../types/family';
import { AvatarManager } from './AvatarManager';
import { FamilyHeader, openMember } from './FamilyHeader';
import { MemberAvatar } from './MemberAvatar';

type ProfileRow = { key: string; title: string; detail?: string; member?: FamilyMember; heading?: boolean };
export function MemberProfile({ accountId, memberId }: { accountId: number; memberId: number }) {
  const { copy, language } = useFamilyStrings(); const { colors } = useAppTheme(); const { showToast } = useToast();
  const loader = useCallback((signal: AbortSignal) => familyDataApi.profile(memberId, signal), [memberId]);
  const query = useFamilyQuery(accountId, `profile:${memberId}`, loader);
  const [deleting, setDeleting] = useState(false); const pendingDelete = useRef(false); const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const profile = query.data; const member = profile?.member;
  const rows = useMemo(() => {
    if (!profile) return [];
    const result: ProfileRow[] = []; const byId = new Map(profile.relatives.map(row => [row.id, row])); const current = profile.member;
    const section = (key: string, title: string, ids: { id: number; label: string }[], hint?: string) => {
      result.push({ key, title, detail: hint, heading: true });
      if (!ids.length) result.push({ key: `${key}:empty`, title: copy.noRelations });
      for (const [index, value] of ids.entries()) result.push({ key: `${key}:${value.id}:${index}`, title: byId.get(value.id)?.fullName ?? copy.selectedMissing(String(value.id)), member: byId.get(value.id), detail: value.label });
    };
    section('parents', copy.parents, [{ id: current.fatherId, label: copy.father }, { id: current.motherId, label: copy.mother }].filter((row): row is { id: number; label: string } => row.id !== null));
    section('spouse', copy.spouse, current.spouseId ? [{ id: current.spouseId, label: copy.spouse }] : []);
    section('children', copy.children, current.childIds.map(id => ({ id, label: copy.children })));
    section('horizontal', copy.horizontal, current.horizontalRelations.map(row => ({ id: row.memberId, label: row.relationType.toLowerCase() === 'sibling' ? copy.sibling : row.relationType.toLowerCase() === 'cousin' ? copy.cousin : row.relationType })), copy.explicitHint);
    section('inferred', copy.inferredSiblings, sharedParentSiblings(current, profile.relatives).map(row => ({ id: row.id, label: copy.inferredSiblings })), copy.inferredHint);
    return result;
  }, [profile, copy]);
  const remove = () => {
    if (!member || pendingDelete.current) return;
    Alert.alert(copy.deleteTitle, copy.deleteMessage(member.fullName), [{ text: copy.cancel, style: 'cancel' }, { text: copy.delete, style: 'destructive', onPress: () => { void (async () => {
      if (pendingDelete.current) return; pendingDelete.current = true; setDeleting(true);
      try {
        try { await familyApi.delete(member.id); } catch (error) { if ((error as { status?: number })?.status !== 404) throw error; }
        if (alive.current) { showToast(copy.removed, 'success'); router.replace('/(tabs)/family'); }
      } catch (error) { if (alive.current) Alert.alert(copy.loadError, familyError(error, copy), [{ text: copy.confirm }]); }
      finally { pendingDelete.current = false; if (alive.current) setDeleting(false); }
    })(); } }]);
  };
  if (!profile || !member) return <AppScreen padded={false}><FamilyHeader title={copy.profile} />{query.status === 'error' ? <ErrorState title={copy.loadError} message={familyError(query.error, copy)} retry={() => void query.reload()} /> : <LoadingState />}</AppScreen>;
  const pair = (label: string, value?: string | null, url?: string | null) => <View style={styles.pair} key={label}>
    <AppText variant="caption" tone="secondary">{label}</AppText>
    {url && value ? <Pressable accessibilityRole="link" accessibilityLabel={`${label}: ${value}`} onPress={() => { void Linking.openURL(url).catch(() => showToast(copy.error, 'warning')); }} style={styles.link}><AppText tone="accent" selectable>{value}</AppText></Pressable> : <AppText selectable>{value || copy.unknown}</AppText>}
  </View>;
  const gender = normalizeGender(member.gender);
  return <AppScreen padded={false}><FamilyHeader title={copy.profile} />
    <FlatList data={rows} keyExtractor={row => row.key} initialNumToRender={12} maxToRenderPerBatch={12} windowSize={5} contentContainerStyle={styles.page}
      refreshControl={<RefreshControl refreshing={query.status === 'loading'} onRefresh={() => void query.reload()} tintColor={colors.accentFamily} />}
      ListHeaderComponent={<View style={styles.header}>
        <AppCard inset style={styles.card}><AppText variant="screenTitle" accessibilityRole="header">{member.fullName}</AppText><AppText tone="secondary">{copy.generationValue(member.generation)}{member.role ? ` · ${member.role}` : ''}</AppText><Badge label={member.lifeStatus === 'DECEASED' ? copy.deceased : copy.living} />
          {pair(copy.birth, member.dateOfBirth ? formatDateOnly(member.dateOfBirth, language) : null)}{member.lifeStatus === 'DECEASED' ? pair(copy.death, member.deathDate ? formatDateOnly(member.deathDate, language) : null) : null}
          {pair(copy.gender, gender === 'male' ? copy.male : gender === 'female' ? copy.female : gender === 'other' ? copy.other : member.gender)}
        </AppCard>
        <AvatarManager member={member} onChanged={() => void query.reload()} />
        <PrimaryButton title={copy.edit} disabled={deleting} onPress={() => router.push({ pathname: '/family/[id]/edit', params: { id: String(member.id) } })} />
        <DestructiveButton title={copy.delete} loading={deleting} onPress={remove} />
        <AppCard inset style={styles.card}><SectionHeader title={copy.contact} />{pair(copy.address, member.address)}{pair(copy.phone, member.phoneNumber, phoneUrl(member.phoneNumber))}{pair(copy.facebook, member.facebookUrl, safeSocialUrl(member.facebookUrl))}{pair(copy.instagram, member.instagramUrl, safeSocialUrl(member.instagramUrl))}</AppCard>
        <AppCard inset style={styles.card}><SectionHeader title={copy.biography} /><AppText selectable>{member.biography || copy.unknown}</AppText></AppCard>
      </View>}
      renderItem={({ item }) => item.heading ? <View style={styles.section}><SectionHeader title={item.title} />{item.detail ? <AppText variant="caption" tone="secondary">{item.detail}</AppText> : null}</View>
        : item.member ? <AppCard style={styles.relative}><ActionRow title={item.title} detail={`${item.detail} · ${copy.generationValue(item.member.generation)}`} leading={<MemberAvatar member={item.member} />} onPress={() => openMember(item.member!.id)} /></AppCard>
          : <AppText tone="secondary" style={styles.empty}>{item.title}</AppText>}
      ListFooterComponent={<View style={styles.footer}>
        <AppCard inset style={styles.card}><SectionHeader title={copy.timeline} />
          {profile.timeline.length ? profile.timeline.slice(0, 5).map(event => <View key={event.id} style={styles.pair}><AppText variant="cardTitle">{event.title}</AppText><AppText tone="secondary">{event.eventDate ? formatDateOnly(event.eventDate, language) : event.eventYear ?? copy.unknown}{event.isApproximate ? ` · ${copy.approximate}` : ''}</AppText>{event.description ? <AppText>{event.description}</AppText> : null}{event.location ? <AppText tone="secondary">{event.location}</AppText> : null}{event.isDerived ? <AppText variant="caption" tone="secondary">{copy.derived}</AppText> : null}</View>) : <AppText tone="secondary">{copy.noTimeline}</AppText>}
          {profile.timeline.length > 5 ? <AppText variant="caption" tone="secondary">{copy.summaryCount(5, profile.timeline.length)}</AppText> : null}
        </AppCard>
        <AppCard inset style={styles.card}><SectionHeader title={copy.anniversaries} />
          {profile.anniversaries.length ? profile.anniversaries.slice(0, 5).map(event => <View key={event.id} style={styles.pair}><AppText variant="cardTitle">{event.title}</AppText><AppText tone="secondary">{formatDateOnly(event.nextSolarDate, language)}</AppText>{event.place ? <AppText>{event.place}</AppText> : null}{event.notes ? <AppText>{event.notes}</AppText> : null}</View>) : <AppText tone="secondary">{copy.noAnniversaries}</AppText>}
          {profile.anniversaries.length > 5 ? <AppText variant="caption" tone="secondary">{copy.summaryCount(5, profile.anniversaries.length)}</AppText> : null}
        </AppCard>
      </View>} />
  </AppScreen>;
}
const styles = StyleSheet.create({ page: { padding: spacing.lg, paddingBottom: spacing.xxxl, width: '100%', maxWidth: 700, alignSelf: 'center' }, header: { gap: spacing.md }, card: { gap: spacing.sm }, pair: { gap: spacing.xxs }, link: { minHeight: 48, justifyContent: 'center' }, section: { paddingTop: spacing.xl, paddingBottom: spacing.sm }, relative: { paddingHorizontal: spacing.md, marginBottom: spacing.xs }, empty: { padding: spacing.md }, footer: { marginTop: spacing.xl, gap: spacing.md } });
