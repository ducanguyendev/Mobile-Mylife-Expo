import { File } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';
import { AvatarPickError } from './avatar-picker';
import { avatarMaxBytes, validPickedAvatar } from './avatar-transport';

export function createAvatarBody(photo: ImagePickerAsset): FormData {
  if (!validPickedAvatar(photo)) throw new AvatarPickError('invalid');
  const body = new FormData();
  if (Platform.OS === 'web' && photo.file) body.append('file', photo.file);
  else {
    // SDK 58's default expo/fetch accepts Blob/File, not RN's legacy URI parts.
    const file = new File(photo.uri);
    if (!file.exists || file.size <= 0 || file.size > avatarMaxBytes) throw new AvatarPickError('invalid');
    body.append('file', file);
  }
  return body;
}
