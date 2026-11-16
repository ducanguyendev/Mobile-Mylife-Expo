import * as ImagePicker from 'expo-image-picker';
import { validatedImageFile, validateSelection, type Selection } from '@/features/library/library-upload';

export async function pickAccountAvatar(): Promise<Selection | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, allowsEditing: false, quality: 1, exif: false });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return validateSelection({ uri: asset.uri, fileName: asset.fileName ?? '', mimeType: asset.mimeType ?? '', fileSize: asset.fileSize, file: asset.file });
}
export async function accountAvatarBody(selection: Selection, signal: AbortSignal) {
  // Reuse the SDK58 FileHandle/signature and size checks verified by M7.
  const file = await validatedImageFile(selection, signal);
  const body = new FormData();
  body.append('file', file, selection.fileName);
  return body;
}
