import { File, FileMode } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { maxPhotoBytes, metadata, mimeExtensions, type Category, type Metadata } from './library-data';
export type Selection = { uri: string; fileName: string; mimeType: string; fileSize?: number; file?: globalThis.File };
export function validateSelection(value: Selection) {
  const mime = value.mimeType?.toLowerCase(); const extension = value.fileName?.split('.').pop()?.toLowerCase() ?? '';
  if (!/^(file:|content:|blob:)/i.test(value.uri) || !Object.hasOwn(mimeExtensions, mime) || !mimeExtensions[mime].includes(extension) || !value.fileName || value.fileName.length > 255 || /[\x00-\x1f/\\]/.test(value.fileName) || value.fileSize !== undefined && (value.fileSize <= 0 || value.fileSize > maxPhotoBytes)) throw Error('LIBRARY_INVALID_IMAGE');
  return { ...value, mimeType: mime };
}
export function validateBatch(items: Selection[]) { if (items.length < 1 || items.length > 20) throw Error('LIBRARY_FILE_COUNT'); return items.map(validateSelection); }
export function matchesSignature(bytes: Uint8Array, mime: string) {
  const starts = (list: number[], offset = 0) => list.every((b, i) => bytes[offset + i] === b);
  if (mime === 'image/jpeg') return starts([255, 216, 255]);
  if (mime === 'image/png') return starts([137, 80, 78, 71, 13, 10, 26, 10]);
  if (mime === 'image/gif') return starts([71, 73, 70, 56, 55, 97]) || starts([71, 73, 70, 56, 57, 97]);
  return mime === 'image/webp' && starts([82, 73, 70, 70]) && starts([87, 69, 66, 80], 8);
}
export async function pickLibraryPhotos(): Promise<Selection[] | null> {
  let result: ImagePicker.ImagePickerResult;
  try { result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 20, allowsEditing: false, quality: 1, exif: false }); }
  catch (error) { throw Error(/permission/i.test(String((error as { code?: string }).code)) ? 'LIBRARY_PERMISSION' : 'LIBRARY_PICKER_UNAVAILABLE'); }
  if (result.canceled) return null;
  return validateBatch(result.assets.map(a => ({ uri: a.uri, fileName: a.fileName ?? '', mimeType: a.mimeType ?? '', fileSize: a.fileSize, file: a.file })));
}
export async function createUploadBody(items: Selection[], input: Metadata, categories: Category[], signal: AbortSignal) {
  const selections = validateBatch(items); const values = metadata(input, categories); const body = new FormData();
  // Validate sequentially; at most one 5 MiB file is inspected at a time.
  for (const item of selections) {
    if (signal.aborted) throw Error('LIBRARY_UPLOAD_CANCELED');
    const file = await validatedImageFile(item, signal);
    // File bytes and display name are verified independently of picker hints.
    body.append('files', file, item.fileName);
  }
  if (signal.aborted) throw Error('LIBRARY_UPLOAD_CANCELED');
  for (const [key, value] of Object.entries(values)) body.append(key, value ?? '');
  return body;
}
export async function validatedImageFile(selection: Selection, signal: AbortSignal) {
    const item = validateSelection(selection);
    if (signal.aborted) throw Error('LIBRARY_UPLOAD_CANCELED');
    const file = Platform.OS === 'web' && item.file ? item.file : new File(item.uri);
    if (file.size <= 0 || file.size > maxPhotoBytes) throw Error('LIBRARY_INVALID_IMAGE');
    let bytes: Uint8Array;
    if (file instanceof File) {
      // File.slice constructs a global Blob from typed arrays, which the
      // existing development client's React Native Blob cannot represent.
      const handle = file.open(FileMode.ReadOnly);
      try { bytes = await handle.readBytes(12); } finally { handle.close(); }
    } else bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (!matchesSignature(bytes, item.mimeType)) throw Error('LIBRARY_INVALID_IMAGE');
    if (signal.aborted) throw Error('LIBRARY_UPLOAD_CANCELED');
    return file;
}
