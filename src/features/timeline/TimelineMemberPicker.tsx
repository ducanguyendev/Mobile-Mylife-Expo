import { useMemo, useState } from 'react';
import { FlatList, Keyboard, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/design-system/components/app-text';
import { MyLifeSearchField } from '@/design-system/components/fields';
import { PrimaryButton, SecondaryButton, TextButton } from '@/design-system/components/buttons';
import { normalizeName } from '@/features/family/data/member-search';
import type { FamilyMember } from '@/features/family/types/family';
import { useAppTheme } from '@/theme/theme-provider';
import type { TimelineCopy } from './timeline-strings';
export function TimelineMemberPicker({ members, selected, copy, onCancel, onConfirm }: { members: FamilyMember[]; selected: number | null; copy: TimelineCopy; onCancel: () => void; onConfirm: (id: number | null) => void }) {
  const { colors, reducedMotion } = useAppTheme(); const [draft, setDraft] = useState(selected); const [search, setSearch] = useState('');
  const rows = useMemo(() => members.filter(m => normalizeName(m.fullName).includes(normalizeName(search))), [members, search]);
  return <Modal visible animationType={reducedMotion ? 'none' : 'slide'} onRequestClose={onCancel}><SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 16, gap: 12 }}>
    <AppText variant="sectionTitle" accessibilityRole="header">{copy.pick}</AppText><MyLifeSearchField accessibilityLabel={copy.memberSearch} placeholder={copy.memberSearch} value={search} onChangeText={setSearch} />
    <AppText>{copy.selected}: {members.find(m => m.id === draft)?.fullName ?? (draft ? `${copy.unknownMember} #${draft}` : copy.none)}</AppText><TextButton title={copy.none} onPress={() => setDraft(null)} />
    <FlatList data={rows} keyExtractor={m => String(m.id)} initialNumToRender={12} maxToRenderPerBatch={12} windowSize={5} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8 }} ListEmptyComponent={<AppText>{copy.noResults}</AppText>}
      renderItem={({ item }) => <Pressable accessibilityRole="radio" accessibilityState={{ checked: draft === item.id }} accessibilityLabel={item.fullName} onPress={() => { Keyboard.dismiss(); setDraft(item.id); }} style={{ minHeight: 64, padding: 16, borderWidth: 1, borderRadius: 16, borderColor: colors.controlBorder, backgroundColor: draft === item.id ? colors.surfaceMuted : colors.surface }}><AppText>{item.fullName}</AppText>{draft === item.id ? <AppText>✓</AppText> : null}</Pressable>} />
    <SecondaryButton title={copy.cancel} onPress={onCancel} /><PrimaryButton title={copy.confirm} onPress={() => { Keyboard.dismiss(); onConfirm(draft); }} />
  </SafeAreaView></Modal>;
}
