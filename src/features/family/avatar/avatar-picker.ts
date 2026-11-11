import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { validPickedAvatar } from './avatar-transport';
const contextKey = 'mylife.family.avatar.picker-context.v1';
let contextQueue = Promise.resolve();
function contextOperation<T>(operation: () => Promise<T>): Promise<T> {
  const next = contextQueue.then(operation, operation);
  contextQueue = next.then(() => undefined, () => undefined);
  return next;
}
const clearContext = (expected: string) => contextOperation(async () => {
  if (await AsyncStorage.getItem(contextKey) !== expected) return false;
  await AsyncStorage.removeItem(contextKey); return true;
});
export class AvatarPickError extends Error { constructor(public reason: 'invalid' | 'permission' | 'unavailable') { super(reason); } }
function assetFrom(result: ImagePicker.ImagePickerResult | ImagePicker.ImagePickerErrorResult | null) {
  if (!result) return null;
  if ('code' in result) throw new AvatarPickError(/permission/i.test(result.code) ? 'permission' : 'unavailable');
  if (result.canceled) return null;
  const asset = result.assets?.[0];
  if (!asset || !validPickedAvatar(asset)) throw new AvatarPickError('invalid');
  return asset;
}
export async function pickMemberAvatar(accountId: number, memberId: number) {
  // Only target IDs/time are persisted for Android activity-result recovery.
  // No image, access/refresh token or password is stored here.
  const context = JSON.stringify({ accountId, memberId, at: Date.now(), nonce: `${Date.now()}:${Math.random()}` });
  await contextOperation(() => AsyncStorage.setItem(contextKey, context)).catch(() => undefined);
  try { return assetFrom(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1, exif: false })); }
  catch (error) {
    if (error instanceof AvatarPickError) throw error;
    throw new AvatarPickError(/permission/i.test(String((error as { code?: string })?.code ?? '')) ? 'permission' : 'unavailable');
  } finally { await clearContext(context).catch(() => undefined); }
}
export async function recoverMemberAvatar(accountId: number, memberId: number) {
  try {
    const raw = await AsyncStorage.getItem(contextKey);
    if (!raw) return null;
    const context = JSON.parse(raw);
    if (context.accountId !== accountId || context.memberId !== memberId || Date.now() - context.at > 10 * 60_000 || Date.now() < context.at) {
      if (Date.now() - context.at > 10 * 60_000 || Date.now() < context.at) await clearContext(raw);
      return null;
    }
    const result = await ImagePicker.getPendingResultAsync();
    if (!await clearContext(raw)) return null;
    return assetFrom(result);
  } catch (error) { if (error instanceof AvatarPickError) throw error; return null; }
}
