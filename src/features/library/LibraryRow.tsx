import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/design-system/components/app-text';
import { AppCard } from '@/design-system/components/surfaces';
import { PrivatePhoto } from './PrivatePhoto';
import type { AlbumDetail, Photo } from './library-data';
import type { LibraryCopy } from './library-strings';
import type { MediaPool } from './library-media';

export type LibraryRowData = { kind: 'album'; album: AlbumDetail } | { kind: 'photo'; photo: Photo };
export const libraryRowKey = (row: LibraryRowData) => row.kind === 'album' ? `a:${row.album.id}` : `p:${row.photo.id}`;
export const LibraryRow = memo(function LibraryRow({ row, pool, copy, mediaVisible, onPhoto, onAlbum }: { row: LibraryRowData; pool: MediaPool; copy: LibraryCopy; mediaVisible: boolean; onPhoto: (id: number) => void; onAlbum: (id: number) => void }) {
  const open = useCallback(() => { if (row.kind === 'album') onAlbum(row.album.id); else onPhoto(row.photo.id); }, [row, onAlbum, onPhoto]);
  const album = row.kind === 'album' ? row.album : undefined;
  const photo = row.kind === 'photo' ? row.photo : undefined;
  const label = album ? `${album.name}, ${copy.count}: ${album.photoCount}` : photo!.title || photo!.fileName;
  const imageId = album ? album.coverPhotoId : photo!.id;
  return <View style={styles.cell}><AppCard inset><Pressable accessibilityRole="button" accessibilityLabel={label} onPress={open}>
    {imageId !== null ? mediaVisible ? <PrivatePhoto photoId={imageId} pool={pool} label={album?.name ?? label} failure={copy.imageFailed} retry={copy.refresh} /> : <View style={styles.imageSpace} />
      : <View style={styles.emptyCover}><AppText>{copy.albums}</AppText></View>}
    {album ? <><AppText variant="label">{album.name}</AppText><AppText>{copy.count}: {album.photoCount}</AppText>{album.description ? <AppText numberOfLines={3}>{album.description}</AppText> : null}</> : <AppText numberOfLines={2}>{label}</AppText>}
  </Pressable></AppCard></View>;
});
const styles = StyleSheet.create({ cell: { flex: 1, maxWidth: '50%', marginBottom: 12 }, imageSpace: { height: 150 }, emptyCover: { height: 100, justifyContent: 'center' } });
