import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { AppScreen } from '@/components/layout/app-screen';
import { AppText } from '@/design-system/components/app-text';
import { DestructiveButton, PrimaryButton, SecondaryButton, TextButton } from '@/design-system/components/buttons';
import { MyLifeTextArea, MyLifeTextField } from '@/design-system/components/fields';
import { blankMetadata, photoMetadata, type AlbumDetail, type Category, type Metadata, type Photo } from './library-data';
import { libraryError, type LibraryCopy } from './library-strings';
import { pickLibraryPhotos, type Selection } from './library-upload';

export type Editor = { kind: 'album'; original?: AlbumDetail } | { kind: 'category'; original?: Category } | { kind: 'photo'; original: Photo } | { kind: 'upload'; albumId: number };
export type EditorValues = { name: string; description: string; metadata: Metadata; selections: Selection[] };
export function LibraryEditor({ editor, categories, copy, busy, locked, onCancel, onSave }: { editor: Editor; categories: Category[]; copy: LibraryCopy; busy: boolean; locked: boolean; onCancel: () => void; onSave: (value: EditorValues) => Promise<void> }) {
  const [name, setName] = useState(editor.kind === 'album' || editor.kind === 'category' ? editor.original?.name ?? '' : '');
  const [description, setDescription] = useState(editor.kind === 'album' ? editor.original?.description ?? '' : '');
  const [values, setValues] = useState(editor.kind === 'photo' ? photoMetadata(editor.original) : blankMetadata());
  const [selections, setSelections] = useState<Selection[]>([]); const [error, setError] = useState(''); const [picking, setPicking] = useState(false);
  const dirty = useRef(false); const alive = useRef(true); const submitted = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const dismiss = () => { if (busy || submitted.current || picking) return; if (dirty.current) Alert.alert(copy.discarded, '', [{ text: copy.keep, style: 'cancel' }, { text: copy.discard, style: 'destructive', onPress: () => { alive.current = false; onCancel(); } }]); else { alive.current = false; onCancel(); } };
  const set = (key: keyof Metadata, value: string | null) => { dirty.current = true; setValues(v => ({ ...v, [key]: value })); };
  const pick = async () => { if (picking || submitted.current) return; setPicking(true); setError(''); try { const photos = await pickLibraryPhotos(); if (alive.current && photos) { dirty.current = true; setSelections(photos); } } catch (e) { if (alive.current) setError(libraryError(e, copy)); } finally { if (alive.current) setPicking(false); } };
  const save = async () => { if (submitted.current || busy || locked) return; submitted.current = true; setError(''); try { await onSave({ name, description, metadata: values, selections }); } catch (e) { setError(libraryError(e, copy)); if (editor.kind === 'upload') setSelections([]); } finally { submitted.current = false; } };
  return <Modal visible animationType="none" onRequestClose={dismiss}><AppScreen>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12, paddingVertical: 16 }}>
        <AppText variant="sectionTitle" accessibilityRole="header">{editor.kind === 'album' ? copy.albums : editor.kind === 'category' ? copy.categories : editor.kind === 'upload' ? copy.upload : copy.edit}</AppText>
        {editor.kind === 'album' || editor.kind === 'category' ? <MyLifeTextField autoFocus label={copy.name} value={name} maxLength={editor.kind === 'album' ? 150 : 100} disabled={busy || locked} onChangeText={v => { dirty.current = true; setName(v); }} /> : null}
        {editor.kind === 'album' ? <MyLifeTextArea label={copy.description} value={description} maxLength={2000} disabled={busy || locked} onChangeText={v => { dirty.current = true; setDescription(v); }} /> : null}
        {editor.kind === 'upload' ? <><AppText>{copy.uploadHint}</AppText><SecondaryButton title={copy.pick} disabled={busy || locked || picking} onPress={() => void pick()} />
          <AppText>{copy.selected}: {selections.length}/20</AppText><View style={{ height: selections.length ? 190 : 0 }}><FlatList horizontal data={selections} keyExtractor={(p, i) => `${p.uri}:${i}`} initialNumToRender={3} renderItem={({ item, index }) => <View style={{ width: 140, marginRight: 8 }}><Image source={{ uri: item.uri }} cachePolicy="none" style={{ height: 110 }} accessibilityLabel={item.fileName} /><AppText numberOfLines={1}>{item.fileName}</AppText><TextButton title={copy.remove} accessibilityLabel={`${copy.remove}: ${item.fileName}`} disabled={busy || locked} onPress={() => setSelections(s => s.filter((_, i) => i !== index))} /></View>} /></View></> : null}
        {editor.kind === 'photo' || editor.kind === 'upload' ? <>
          <MyLifeTextField label={copy.photoTitle} value={values.title ?? ''} maxLength={200} disabled={busy || locked} onChangeText={v => set('title', v)} />
          <MyLifeTextArea label={copy.description} value={values.description ?? ''} maxLength={2000} disabled={busy || locked} onChangeText={v => set('description', v)} />
          <MyLifeTextField label={copy.author} value={values.author ?? ''} maxLength={200} disabled={busy || locked} onChangeText={v => set('author', v)} />
          <MyLifeTextField label={copy.date} value={values.displayDate ?? ''} maxLength={10} placeholder="DD/MM/YYYY" disabled={busy || locked} onChangeText={v => set('displayDate', v)} />
          <AppText variant="label">{copy.categories}</AppText>
          {editor.kind === 'upload' || editor.original.category === '__album__' ? <SecondaryButton title={copy.noCategory} accessibilityState={{ selected: values.category === null }} disabled={busy || locked} onPress={() => set('category', null)} /> : null}
          {categories.map(c => <SecondaryButton key={c.id} title={c.name} accessibilityState={{ selected: values.category === c.slug }} disabled={busy || locked} onPress={() => set('category', c.slug)} />)}
        </> : null}
        {error ? <AppText accessibilityRole="alert" tone="error">{error}</AppText> : null}
        {locked ? <AppText accessibilityRole="alert" tone="error">{copy.uncertain}</AppText> : null}
        {busy && editor.kind === 'upload' ? <AppText accessibilityLiveRegion="polite">{copy.uploading}</AppText> : null}
        <PrimaryButton title={editor.kind === 'upload' ? copy.uploadNow : copy.save} loading={busy} disabled={locked || picking || editor.kind === 'upload' && !selections.length} onPress={() => void save()} />
        <SecondaryButton title={copy.cancel} disabled={busy || picking} onPress={dismiss} />
      </ScrollView>
    </KeyboardAvoidingView>
  </AppScreen></Modal>;
}
export function LibraryDeleteDialog({ title, consequence, copy, busy, locked, error, onCancel, onConfirm }: { title: string; consequence: string; copy: LibraryCopy; busy: boolean; locked: boolean; error: string; onCancel: () => void; onConfirm: () => void }) {
  return <Modal visible animationType="none" onRequestClose={() => { if (!busy) onCancel(); }}><AppScreen><ScrollView contentContainerStyle={{ gap: 20, paddingVertical: 24 }}>
    <AppText variant="sectionTitle" accessibilityRole="header">{copy.confirm}</AppText><AppText>{title}</AppText><AppText>{consequence}</AppText>
    {error ? <AppText accessibilityRole="alert" tone="error">{error}</AppText> : null}{locked ? <AppText tone="error">{copy.uncertain}</AppText> : null}
    <DestructiveButton title={copy.remove} loading={busy} disabled={locked} onPress={onConfirm} /><SecondaryButton title={copy.cancel} disabled={busy} onPress={onCancel} />
  </ScrollView></AppScreen></Modal>;
}
