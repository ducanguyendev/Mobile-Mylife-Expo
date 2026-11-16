import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AppState, FlatList, Modal, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { AppHeader, AppScreen } from '@/components/layout/app-screen';
import { AppText } from '@/design-system/components/app-text';
import { AppCard } from '@/design-system/components/surfaces';
import { PrimaryButton, SecondaryButton, TextButton } from '@/design-system/components/buttons';
import { MyLifeSearchField } from '@/design-system/components/fields';
import { useAuth } from '@/features/auth/context/auth-provider';
import { createFamilyQuery } from '@/features/family/data/family-query';
import { useAppTheme } from '@/theme/theme-provider';
import { assertUnchanged, libraryApi, libraryMutationsForAccount } from './library-api';
import { albumWrite, categoryName, metadata, nextPhoto, normalizeSearch, selectPhotos, type AlbumDetail, type Category, type Photo } from './library-data';
import { createMediaPool } from './library-media';
import { createUploadBody } from './library-upload';
import { PrivatePhoto } from './PrivatePhoto';
import { LibraryDeleteDialog, LibraryEditor, type Editor, type EditorValues } from './LibraryDialogs';
import { libraryError, libraryStrings } from './library-strings';

type Deleting = { kind: 'album'; item: AlbumDetail } | { kind: 'photo'; item: Photo; albumId: number } | { kind: 'category'; item: Category };
type Row = { kind: 'album'; album: AlbumDetail } | { kind: 'photo'; photo: Photo };
export function LibraryScreen({ albumId }: { albumId?: number }) {
  const { user, isUser } = useAuth(); const { language } = useAppTheme();
  if (!user || !isUser) return <AppScreen><AppText>{libraryStrings[language].forbidden}</AppText></AppScreen>;
  return <LibraryExplorer key={`${user.id}:${user.role}:${albumId ?? 'all'}`} accountId={user.id} albumId={albumId} />;
}
function LibraryExplorer({ accountId, albumId }: { accountId: number; albumId?: number }) {
  const { language, colors } = useAppTheme(); const copy = libraryStrings[language];
  const query = useMemo(() => createFamilyQuery(libraryApi.overview), []);
  const state = useSyncExternalStore(query.subscribe, query.getSnapshot, query.getSnapshot);
  const [actions] = useState(() => libraryMutationsForAccount(accountId)); const mutation = useSyncExternalStore(actions.subscribe, actions.getSnapshot, actions.getSnapshot);
  const [pool, setPool] = useState(createMediaPool); const [visible, setVisible] = useState(false);
  const active = useRef(false); const operation = useRef<AbortController | null>(null);
  const [search, setSearch] = useState(''); const [slug, setSlug] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor>(); const [deleting, setDeleting] = useState<Deleting>(); const [viewing, setViewing] = useState<number>(); const [zoom, setZoom] = useState(false); const [message, setMessage] = useState('');
  useFocusEffect(useCallback(() => {
    let currentPool = createMediaPool(); setPool(currentPool);
    const change = (value: boolean) => {
      active.current = value; actions.setActive(value); setVisible(value);
      if (value) { currentPool = createMediaPool(); setPool(currentPool); void query.load(); }
      else { query.cancel(); operation.current?.abort(); currentPool.clear(); setViewing(undefined); setDeleting(undefined); }
    };
    change(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', next => change(next === 'active'));
    return () => { active.current = false; actions.setActive(false); query.cancel(); operation.current?.abort(); currentPool.clear(); subscription.remove(); setEditor(undefined); setVisible(false); };
  }, [query, actions]));
  const data = state.data; const categories = data?.categories ?? []; const selectedAlbum = data?.albums.find(a => a.id === albumId);
  const photos = useMemo(() => selectPhotos(albumId === undefined ? state.data?.albums.flatMap(a => a.photos) ?? [] : state.data?.albums.find(a => a.id === albumId)?.photos ?? [], search, slug), [state.data, albumId, search, slug]);
  const showPhotos = albumId !== undefined || !!search.trim() || slug !== null;
  const albumRows: Row[] = (data?.albums ?? []).filter(a => normalizeSearch(`${a.name} ${a.description ?? ''}`).includes(normalizeSearch(search))).map(album => ({ kind: 'album', album }));
  const rows: Row[] = showPhotos ? [...(albumId === undefined && slug === null ? albumRows : []), ...photos.map(photo => ({ kind: 'photo' as const, photo }))] : albumRows;
  const currentPhoto = photos.find(p => p.id === viewing);
  const label = (p: Photo) => p.title || p.fileName;
  const refresh = async () => {
    if (!active.current || mutation.busy || operation.current) return;
    const controller = new AbortController(); operation.current = controller; setMessage('');
    try { if (mutation.needsReconcile) await actions.reconcile(controller.signal); if (active.current && !controller.signal.aborted) await query.load(); }
    catch (e) { if (active.current) setMessage(libraryError(e, copy)); }
    finally { if (operation.current === controller) operation.current = null; }
  };
  const perform = async (prepare: (signal: AbortSignal) => Promise<() => Promise<unknown>>) => {
    if (operation.current || !active.current) throw Error('LIBRARY_RECONCILE');
    const controller = new AbortController(); operation.current = controller; setMessage('');
    try { await actions.run(prepare, controller.signal); if (active.current && !controller.signal.aborted) { setEditor(undefined); setDeleting(undefined); setViewing(undefined); await query.load(); } }
    catch (e) { if (active.current) { setMessage(libraryError(e, copy)); await query.load(); } throw e; }
    finally { if (operation.current === controller) operation.current = null; }
  };
  const save = async (values: EditorValues) => {
    const target = editor; if (!target) return;
    await perform(async signal => {
      if (target.kind === 'album') {
        const write = albumWrite(values.name, values.description);
        if (target.original) { const latest = await libraryApi.album(target.original.id, signal); assertUnchanged(target.original, latest); return () => libraryApi.updateAlbum(latest.id, write.name, write.description, signal); }
        return () => libraryApi.createAlbum(write.name, write.description, signal);
      }
      const fresh = await libraryApi.overview(signal);
      if (target.kind === 'category') {
        const name = categoryName(values.name);
        if (target.original) { const latest = fresh.categories.find(c => c.id === target.original!.id); assertUnchanged(target.original, latest); if (!latest || latest.isDefault) throw Error('LIBRARY_CONFLICT'); return () => libraryApi.renameCategory(latest.id, name, signal); }
        return () => libraryApi.createCategory(name, signal);
      }
      const write = metadata(values.metadata, fresh.categories);
      if (target.kind === 'photo') { const latest = fresh.albums.flatMap(a => a.photos).find(p => p.id === target.original.id); assertUnchanged(target.original, latest); return () => libraryApi.updatePhoto(target.original.id, write, fresh.categories, signal); }
      if (!fresh.albums.some(a => a.id === target.albumId)) throw Error('LIBRARY_CONFLICT');
      const body = await createUploadBody(values.selections, write, fresh.categories, signal);
      return () => libraryApi.upload(target.albumId, body, signal);
    });
  };
  const requestDelete = async (target: Deleting) => {
    if (operation.current || mutation.busy || mutation.needsReconcile || !active.current) return;
    if (target.kind !== 'album') { setViewing(undefined); setDeleting(target); return; }
    const controller = new AbortController(); operation.current = controller;
    try { const item = await libraryApi.album(target.item.id, controller.signal); if (active.current && !controller.signal.aborted) setDeleting({ kind: 'album', item }); }
    catch (e) { if (active.current) setMessage(libraryError(e, copy)); }
    finally { if (operation.current === controller) operation.current = null; }
  };
  const remove = async () => {
    const target = deleting; if (!target) return;
    try { await perform(async signal => {
      if (target.kind === 'album') { assertUnchanged(target.item, await libraryApi.album(target.item.id, signal)); return () => libraryApi.deleteAlbum(target.item.id, signal); }
      const fresh = await libraryApi.overview(signal);
      if (target.kind === 'category') { const latest = fresh.categories.find(c => c.id === target.item.id); assertUnchanged(target.item, latest); if (!latest || latest.isDefault) throw Error('LIBRARY_CONFLICT'); return () => libraryApi.deleteCategory(target.item.id, signal); }
      assertUnchanged(target.item, fresh.albums.find(a => a.id === target.albumId)?.photos.find(p => p.id === target.item.id));
      return () => libraryApi.deletePhoto(target.item.id, signal);
    }); } catch { /* Error remains visible; authoritative records are retained. */ }
  };
  const locked = mutation.busy || mutation.needsReconcile || state.status !== 'ready';
  const privatePhoto = (p: Photo, full = false, scale = 1) => <PrivatePhoto key={`${accountId}:${p.id}:${p.createdAt}`} photoId={p.id} pool={pool} label={label(p)} failure={copy.imageFailed} retry={copy.refresh} full={full} scale={scale} />;
  const header = <View style={{ gap: 12, paddingVertical: 16 }}>
    <TextButton title={`${copy.close} · ${albumId === undefined ? copy.memories : copy.albums}`} onPress={() => router.back()} />
    <AppHeader title={selectedAlbum?.name ?? copy.title} subtitle={selectedAlbum?.description ?? undefined} />
    <AppText>{copy.albums}: {data?.albums.length ?? '…'} · {copy.count}: {selectedAlbum?.photoCount ?? data?.albums.reduce((n, a) => n + a.photoCount, 0) ?? '…'}</AppText>
    {albumId !== undefined && data && !selectedAlbum ? <AppText tone="error">{copy.notFound}</AppText> : null}
    <MyLifeSearchField value={search} onChangeText={setSearch} accessibilityLabel={copy.search} placeholder={copy.search} />
    <ScrollView horizontal accessibilityLabel={copy.categories} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      <SecondaryButton title={copy.all} accessibilityState={{ selected: slug === null }} onPress={() => setSlug(null)} />
      {categories.map(c => <SecondaryButton key={c.id} title={c.name} accessibilityState={{ selected: slug === c.slug }} onPress={() => setSlug(c.slug)} />)}
    </ScrollView>
    <SecondaryButton title={copy.refresh} disabled={mutation.busy} onPress={() => void refresh()} />
    {state.status === 'loading' ? <AppText accessibilityLiveRegion="polite">{copy.loading}</AppText> : null}
    {state.status === 'error' ? <AppText tone="error" accessibilityRole="alert">{libraryError(state.error, copy)}</AppText> : null}
    {message ? <AppText tone="error" accessibilityRole="alert">{message}</AppText> : null}
    {mutation.needsReconcile ? <AppText tone="error" accessibilityRole="alert">{copy.uncertain}</AppText> : null}
    {selectedAlbum ? <><PrimaryButton title={copy.upload} disabled={locked} onPress={() => setEditor({ kind: 'upload', albumId: selectedAlbum.id })} /><SecondaryButton title={copy.edit} disabled={locked} onPress={() => setEditor({ kind: 'album', original: selectedAlbum })} /><TextButton title={copy.remove} disabled={locked} onPress={() => void requestDelete({ kind: 'album', item: selectedAlbum })} /></> : albumId === undefined ? <><PrimaryButton title={copy.addAlbum} disabled={locked} onPress={() => setEditor({ kind: 'album' })} /><SecondaryButton title={copy.addCategory} disabled={locked} onPress={() => setEditor({ kind: 'category' })} />
      {categories.map(c => <View key={c.id} style={{ gap: 4 }}><AppText>{c.name}{c.isDefault ? ` · ${copy.defaultCategory}` : ''}</AppText>{!c.isDefault ? <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}><TextButton title={copy.edit} accessibilityLabel={`${copy.edit}: ${c.name}`} disabled={locked} onPress={() => setEditor({ kind: 'category', original: c })} /><TextButton title={copy.remove} accessibilityLabel={`${copy.remove}: ${c.name}`} disabled={locked} onPress={() => void requestDelete({ kind: 'category', item: c })} /></View> : null}</View>)}
    </> : null}
  </View>;
  return <AppScreen>{visible ? <FlatList key={showPhotos ? 'photos' : 'albums'} data={rows} numColumns={2} keyExtractor={row => row.kind === 'album' ? `a:${row.album.id}` : `p:${row.photo.id}`} initialNumToRender={6} maxToRenderPerBatch={4} windowSize={3} removeClippedSubviews
    columnWrapperStyle={{ gap: 10 }} contentContainerStyle={{ paddingBottom: 24 }} ListHeaderComponent={header}
    refreshControl={<RefreshControl refreshing={state.status === 'loading'} onRefresh={() => void refresh()} tintColor={colors.accentFamily} />}
    ListEmptyComponent={state.status === 'ready' ? <AppCard inset><AppText>{showPhotos ? copy.noPhotos : copy.empty}</AppText></AppCard> : undefined}
    renderItem={({ item }) => <View style={{ flex: 1, maxWidth: '50%', marginBottom: 12 }}><AppCard inset>
      {item.kind === 'album' ? <Pressable accessibilityRole="button" accessibilityLabel={`${item.album.name}, ${copy.count}: ${item.album.photoCount}`} onPress={() => router.push({ pathname: '/library/[albumId]', params: { albumId: item.album.id } })}>
        {item.album.coverPhotoId !== null ? <PrivatePhoto photoId={item.album.coverPhotoId} pool={pool} label={item.album.name} failure={copy.imageFailed} retry={copy.refresh} /> : <View style={{ height: 100, justifyContent: 'center' }}><AppText>{copy.albums}</AppText></View>}
        <AppText variant="label">{item.album.name}</AppText><AppText>{copy.count}: {item.album.photoCount}</AppText>{item.album.description ? <AppText numberOfLines={3}>{item.album.description}</AppText> : null}
      </Pressable> : <Pressable accessibilityRole="button" accessibilityLabel={label(item.photo)} onPress={() => { setZoom(false); setViewing(item.photo.id); }}>{privatePhoto(item.photo)}<AppText numberOfLines={2}>{label(item.photo)}</AppText></Pressable>}
    </AppCard></View>} /> : <AppText>{copy.title}</AppText>}
    {editor ? <LibraryEditor editor={editor} categories={categories} copy={copy} busy={mutation.busy} locked={mutation.needsReconcile} onSave={save} onCancel={() => setEditor(undefined)} /> : null}
    {deleting ? <LibraryDeleteDialog title={deleting.kind === 'photo' ? label(deleting.item) : deleting.item.name} consequence={deleting.kind === 'album' ? `${copy.count}: ${deleting.item.photoCount}. ${copy.deleteAlbum}` : deleting.kind === 'photo' ? copy.deletePhoto : copy.deleteCategory} copy={copy} busy={mutation.busy} locked={mutation.needsReconcile} error={message} onCancel={() => setDeleting(undefined)} onConfirm={() => void remove()} /> : null}
    {currentPhoto ? <Modal visible animationType="none" onRequestClose={() => setViewing(undefined)}><AppScreen><ScrollView contentContainerStyle={{ gap: 12, paddingVertical: 16 }}>
      <TextButton title={copy.close} onPress={() => setViewing(undefined)} />
      <ScrollView horizontal maximumZoomScale={4} minimumZoomScale={1} centerContent contentContainerStyle={{ minWidth: '100%' }}><View style={{ width: zoom ? 900 : 300 }}>{privatePhoto(currentPhoto, true, zoom ? 3 : 1)}</View></ScrollView>
      <SecondaryButton title={zoom ? copy.zoomOut : copy.zoom} onPress={() => setZoom(z => !z)} />
      <AppText variant="sectionTitle">{label(currentPhoto)}</AppText>{currentPhoto.caption ? <AppText>{currentPhoto.caption}</AppText> : null}
      <AppText>{copy.date}: {currentPhoto.displayDate ?? '—'}</AppText><AppText>{copy.author}: {currentPhoto.author ?? '—'}</AppText><AppText>{copy.categories}: {categories.find(c => c.slug === currentPhoto.category)?.name ?? copy.noCategory}</AppText><AppText>{currentPhoto.fileName}</AppText>
      <SecondaryButton title={copy.previous} disabled={photos[0]?.id === currentPhoto.id} onPress={() => { setZoom(false); setViewing(nextPhoto(photos, currentPhoto.id, -1)?.id); }} /><SecondaryButton title={copy.next} disabled={photos.at(-1)?.id === currentPhoto.id} onPress={() => { setZoom(false); setViewing(nextPhoto(photos, currentPhoto.id, 1)?.id); }} />
      <SecondaryButton title={copy.edit} disabled={locked} onPress={() => { setViewing(undefined); setEditor({ kind: 'photo', original: currentPhoto }); }} /><TextButton title={copy.remove} disabled={locked} onPress={() => { const parent = data?.albums.find(a => a.photos.some(p => p.id === currentPhoto.id)); if (parent) void requestDelete({ kind: 'photo', item: currentPhoto, albumId: parent.id }); }} />
    </ScrollView></AppScreen></Modal> : null}
  </AppScreen>;
}
