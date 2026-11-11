import { useMemo, useState } from 'react';
import { Alert, FlatList, Keyboard, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/design-system/components/app-text';
import { MyLifeSearchField } from '@/design-system/components/fields';
import { PrimaryButton, SecondaryButton, TextButton } from '@/design-system/components/buttons';
import { ErrorState, LoadingState } from '@/components/feedback/states';
import { spacing } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';
import type { FamilyMember } from '../types/family';
import { normalizeName } from '../data/member-search';
import { useFamilyStrings } from '../i18n/use-family-strings';

type Props = { title: string; members: FamilyMember[]; selected: string[]; selfId?: number; multiple?: boolean; loading?: boolean; error?: string; onRetry?: () => void; onCancel: () => void; onConfirm: (ids: string[]) => void };
/** Mount per opening: drafts never mutate the form until explicit confirmation. */
export function RelationshipPicker({ title, members, selected, selfId, multiple = false, loading, error, onRetry, onCancel, onConfirm }: Props) {
  const { colors, reducedMotion } = useAppTheme(); const { copy } = useFamilyStrings();
  const [draft, setDraft] = useState(() => [...selected]); const [search, setSearch] = useState('');
  const candidates = useMemo(() => members.filter(member => member.id !== selfId), [members, selfId]);
  const byId = useMemo(() => new Map(candidates.map(member => [String(member.id), member])), [candidates]);
  const visible = useMemo(() => {
    const query = normalizeName(search);
    const rows = candidates.filter(member => !query || normalizeName(member.fullName).includes(query));
    return rows.slice().sort((a, b) => Number(draft.includes(String(b.id))) - Number(draft.includes(String(a.id))) || a.fullName.localeCompare(b.fullName));
  }, [candidates, draft, search]);
  const confirm = () => {
    Keyboard.dismiss();
    const commit = () => onConfirm(draft);
    if (selected.some(id => !draft.includes(id))) Alert.alert(copy.removeLinksTitle, copy.removeLinksMessage, [{ text: copy.cancel, style: 'cancel' }, { text: copy.confirm, onPress: commit }]);
    else commit();
  };
  return <Modal visible animationType={reducedMotion ? 'none' : 'slide'} presentationStyle="fullScreen" onRequestClose={onCancel}>
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}><AppText variant="sectionTitle" accessibilityRole="header" style={{ flex: 1 }}>{title}</AppText><TextButton style={{ flexBasis: 100, flexShrink: 1 }} title={copy.cancel} onPress={onCancel} compact /></View>
      <View style={styles.search}><MyLifeSearchField accessibilityLabel={copy.search} placeholder={copy.search} value={search} onChangeText={setSearch} /><AppText variant="caption" tone="secondary">{copy.pickerHint}</AppText></View>
      <View style={styles.selection}>
        <AppText variant="label">{copy.selected(draft.length)}</AppText>
        <AppText numberOfLines={3} tone="secondary">{draft.map(id => byId.get(id)?.fullName ?? copy.selectedMissing(id)).join(' · ') || copy.noRelations}</AppText>
        <TextButton title={copy.clearSelection} onPress={() => setDraft([])} compact />
      </View>
      {loading ? <LoadingState /> : error ? <ErrorState title={copy.loadError} message={error} retry={onRetry} /> : <FlatList
        data={visible} keyExtractor={member => String(member.id)} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" initialNumToRender={12} maxToRenderPerBatch={12} windowSize={5}
        contentContainerStyle={styles.rows} ListEmptyComponent={<View style={styles.selection}><AppText variant="cardTitle">{copy.noResults}</AppText><AppText tone="secondary">{copy.noResultsMessage}</AppText></View>}
        renderItem={({ item }) => {
          const id = String(item.id); const checked = draft.includes(id);
          return <Pressable accessibilityRole={multiple ? 'checkbox' : 'radio'} accessibilityState={{ checked }} accessibilityLabel={`${item.fullName}, ${copy.generationValue(item.generation)}`}
            onPress={() => setDraft(previous => multiple ? previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id] : previous.includes(id) ? [] : [id])}
            style={({ pressed }) => [styles.row, { backgroundColor: checked ? colors.surfaceMuted : colors.surface, borderColor: checked ? colors.accentFamily : colors.controlBorder, opacity: pressed ? .8 : 1 }]}>
            <View style={{ flex: 1 }}><AppText variant="bodyMedium">{item.fullName}</AppText><AppText variant="caption" tone="secondary">{copy.generationValue(item.generation)}{item.role ? ` · ${item.role}` : ''}</AppText></View>
            <AppText tone="accent">{checked ? '✓' : '○'}</AppText>
          </Pressable>;
        }} />}
      <View style={styles.footer}><SecondaryButton title={copy.cancel} onPress={onCancel} /><PrimaryButton title={copy.confirm} onPress={confirm} disabled={!!loading || !!error} /></View>
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({ screen: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm }, search: { paddingHorizontal: spacing.md, gap: spacing.xs }, selection: { padding: spacing.md, gap: spacing.xs }, rows: { padding: spacing.md, gap: spacing.sm }, row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderRadius: 16 }, footer: { padding: spacing.md, gap: spacing.xs } });
