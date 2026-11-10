import { router } from 'expo-router';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { AppScrollScreen, LargeTitleHeader, SectionHeader } from '@/components/layout/app-screen';
import { EmptyState, ErrorState, LoadingState, SkeletonBlock } from '@/components/feedback/states';
import { AppText } from '@/design-system/components/app-text';
import { Avatar } from '@/design-system/components/avatar';
import { PrimaryButton } from '@/design-system/components/buttons';
import { ActionRow, AppCard } from '@/design-system/components/surfaces';
import { spacing } from '@/design-system/tokens';
import { useAuth } from '@/features/auth/context/auth-provider';
import { useHome, useDeviceClock } from '@/features/home/use-home';
import { familySummary, formatDateOnly, greetingPeriod, recentAlbums, upcomingAnniversaries } from '@/features/home/home-data';
import type { SectionState } from '@/features/home/home-resource';
import { useLocalization } from '@/localization/use-localization';
import { useAppTheme } from '@/theme/theme-provider';

export default function HomeScreen() {
  const { user, isUser } = useAuth();
  const { copy, locale } = useLocalization();
  const now = useDeviceClock();
  const name = user?.displayName?.trim() || user?.fullName?.trim() || user?.name?.trim();
  const title = `${copy[greetingPeriod(now)]}${name ? `, ${name}` : ''}`;
  return <HomeContent key={`${user?.id}:${user?.role}`} accountId={isUser ? user?.id : undefined} title={title}
    date={new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(now)} now={now} />;
}
function HomeContent({ accountId, title, date, now }: { accountId?: number; title: string; date: string; now: Date }) {
  const { copy } = useLocalization();
  if (!accountId) return <AppScrollScreen><LargeTitleHeader title={title} eyebrow={date} /><EmptyState title={copy.adminHome} message={copy.adminMessage} /></AppScrollScreen>;
  return <UserHome accountId={accountId} title={title} date={date} now={now} />;
}
function UserHome({ accountId, title, date, now }: { accountId: number; title: string; date: string; now: Date }) {
  const { state, refresh, retry } = useHome(accountId);
  const { colors } = useAppTheme();
  const { copy, language } = useLocalization();
  const family = familySummary(state.family.data ?? []);
  const events = upcomingAnniversaries(state.anniversaries.data ?? [], now);
  const albums = recentAlbums(state.albums.data ?? []);
  const refreshing = Object.values(state).some((section) => section.status === 'loading');
  return <AppScrollScreen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.accentFamily} colors={[colors.accentFamily]} />}>
    <LargeTitleHeader title={title} eyebrow={date} subtitle={copy.homeSubtitle} />
    <View style={styles.page}>
      <SectionHeader title={copy.familySummary} />
      <DashboardSection state={state.family} retry={() => void retry('family')}>
        {family.count === 0 ? <EmptyState title={copy.familyEmpty} message={copy.familyEmptyMessage} action={{ label: copy.viewFamily, onPress: () => router.push('/(tabs)/family') }} /> : <AppCard style={[styles.card, { backgroundColor: colors.accentFamily }]}>
          <AppText variant="screenTitle" style={{ color: colors.onAccent }}>{copy.members(family.count)}</AppText>
          <AppText style={{ color: colors.onAccentMuted }}>{family.generations ? copy.generations(family.generations) : copy.noGeneration}</AppText>
          <PrimaryButton title={copy.viewFamily} onPress={() => router.push('/(tabs)/family')} style={{ borderColor: colors.onAccentMuted }} />
        </AppCard>}
        {family.previews.length ? <AppCard style={styles.preview}>{family.previews.map((member) => <ActionRow key={member.id} title={member.fullName?.trim() || copy.unnamed}
          leading={<Avatar name={member.fullName || ''} />} onPress={() => router.push({ pathname: '/family/[id]', params: { id: member.id } })} />)}</AppCard> : null}
      </DashboardSection>
      <SectionHeader title={copy.upcoming} />
      <DashboardSection state={state.anniversaries} retry={() => void retry('anniversaries')}>
        {events.length ? <AppCard style={styles.card}>{events.map((event) => <View key={event.id} style={styles.entry}>
          <AppText variant="cardTitle">{event.title?.trim() || copy.unnamed}</AppText><AppText tone="secondary">{formatDateOnly(event.nextSolarDate, language)}</AppText>
        </View>)}</AppCard> : <EmptyState title={copy.anniversaryEmpty} message={copy.anniversaryEmptyMessage} />}
        <AppText variant="caption" tone="tertiary">{copy.calendarNotice}</AppText>
      </DashboardSection>
      <SectionHeader title={copy.recentAlbums} />
      <DashboardSection state={state.albums} retry={() => void retry('albums')}>
        {albums.length ? <AppCard style={styles.card}>{albums.map((album) => <View key={album.id} style={styles.entry}>
          <View style={[styles.albumPlaceholder, { backgroundColor: colors.surfaceMuted }]} accessible={false}><AppText tone="secondary">▧</AppText></View>
          <AppText variant="cardTitle">{album.name.trim() || copy.unnamed}</AppText><AppText tone="secondary">{copy.photos(album.photoCount)}</AppText>
        </View>)}</AppCard> : <EmptyState title={copy.libraryEmpty} message={copy.libraryEmptyMessage} />}
        <AppText variant="caption" tone="tertiary">{copy.libraryNotice}</AppText>
      </DashboardSection>
    </View>
  </AppScrollScreen>;
}
function DashboardSection<T>({ state, retry, children }: { state: SectionState<T>; retry: () => void; children: React.ReactNode }) {
  const { copy } = useLocalization();
  if (state.status === 'error') return <ErrorState title={copy.errorTitle} message={copy.errorMessage} retry={retry} />;
  if (state.data === undefined) return <View style={styles.loading}><LoadingState /><SkeletonBlock height={48} /><SkeletonBlock width="65%" /></View>;
  return <View style={styles.section}>{children}</View>;
}
const styles = StyleSheet.create({
  page: { gap: spacing.sm, paddingBottom: spacing.xl }, card: { padding: spacing.lg, gap: spacing.md }, preview: { paddingHorizontal: spacing.lg },
  section: { gap: spacing.md, marginBottom: spacing.lg }, entry: { gap: spacing.xs }, loading: { gap: spacing.sm, marginBottom: spacing.lg },
  albumPlaceholder: { height: 48, width: 64, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
