import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import type { ImagePickerAsset } from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/design-system/components/app-text';
import { PrimaryButton, SecondaryButton, TextButton } from '@/design-system/components/buttons';
import { AppCard } from '@/design-system/components/surfaces';
import { useAppTheme } from '@/theme/theme-provider';
import { useAuth } from '@/features/auth/context/auth-provider';
import { useToast } from '@/components/feedback/toast-provider';
import { spacing } from '@/design-system/tokens';
import { familyApi } from '../api/familyApi';
import { familyDataApi } from '../api/familyDataApi';
import { AvatarPickError, pickMemberAvatar, recoverMemberAvatar } from '../avatar/avatar-picker';
import { createAvatarBody } from '../avatar/avatar-body';
import { useFamilyStrings } from '../i18n/use-family-strings';
import type { FamilyMember } from '../types/family';
import { MemberAvatar } from './MemberAvatar';

export function AvatarManager({ member, onChanged }: { member: FamilyMember; onChanged: (member: FamilyMember) => void }) {
  const { copy } = useFamilyStrings(); const { colors, reducedMotion } = useAppTheme();
  const { user } = useAuth(); const { showToast } = useToast(); const window = useWindowDimensions();
  const [pending, setPending] = useState<ImagePickerAsset | null>(null);
  const [busy, setBusy] = useState(false); const busyRef = useRef(false); const active = useRef(true);
  const [message, setMessage] = useState(''); const [viewer, setViewer] = useState(false);
  const [unavailable, setUnavailable] = useState(false); const [retryKey, setRetryKey] = useState(0);
  const pickMessage = (error: unknown) => error instanceof AvatarPickError ? error.reason === 'permission' ? copy.avatarPermission : error.reason === 'invalid' ? copy.avatarInvalid : copy.avatarFailure : copy.avatarFailure;
  useEffect(() => {
    active.current = true;
    void recoverMemberAvatar(user?.id ?? 0, member.id).then(asset => { if (active.current && asset) setPending(asset); }).catch(() => { if (active.current) setMessage(copy.avatarFailure); });
    return () => { active.current = false; };
  }, [user?.id, member.id, copy.avatarFailure]);
  const choose = async () => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setMessage('');
    try { const asset = await pickMemberAvatar(user?.id ?? 0, member.id); if (active.current && asset) setPending(asset); }
    catch (error) { if (active.current) setMessage(pickMessage(error)); }
    finally { busyRef.current = false; if (active.current) setBusy(false); }
  };
  const mutate = async (remove = false) => {
    if (busyRef.current || (!remove && !pending)) return;
    busyRef.current = true; setBusy(true); setMessage('');
    try {
      if (remove) await familyApi.deleteAvatar(member.id);
      else {
        await familyApi.uploadAvatar(member.id, createAvatarBody(pending!));
      }
      const authoritative = await familyDataApi.get(member.id);
      if (active.current) { setPending(null); setUnavailable(false); onChanged(authoritative); showToast(remove ? copy.avatarRemoved : copy.avatarSaved, 'success'); }
    } catch (error) {
      if (__DEV__) { const failure = error as { kind?: string; status?: number; code?: string }; console.warn('[MyLife avatar] operation failed', { kind: failure.kind, status: failure.status, code: failure.code }); }
      if (active.current) setMessage(error instanceof AvatarPickError ? pickMessage(error) : copy.avatarFailure);
    }
    finally { busyRef.current = false; if (active.current) setBusy(false); }
  };
  return <AppCard inset style={styles.card}>
    <AppText variant="sectionTitle" accessibilityRole="header">{copy.avatar}</AppText>
    <Pressable accessibilityRole="button" accessibilityLabel={copy.imageLabel(member.fullName)} onPress={() => setViewer(true)} style={styles.preview}>
      <MemberAvatar member={member} size={96} retryKey={retryKey} onUnavailable={() => setUnavailable(true)} />
    </Pressable>
    <AppText tone="secondary">{copy.avatarHint}</AppText>
    {unavailable ? <><AppText accessibilityLiveRegion="polite" tone="secondary">{copy.avatarLoadFailure}</AppText><TextButton title={copy.retry} onPress={() => { setUnavailable(false); setRetryKey(value => value + 1); }} /></> : null}
    {pending ? <View style={styles.card}><Image accessible accessibilityRole="image" accessibilityLabel={copy.previewPhoto} source={{ uri: pending.uri }} cachePolicy="none" contentFit="contain" style={styles.selectedPhoto} /><PrimaryButton title={copy.uploadPhoto} loading={busy} onPress={() => void mutate()} /><SecondaryButton title={copy.cancelPhoto} disabled={busy} onPress={() => { setPending(null); setMessage(''); }} /></View> : null}
    <SecondaryButton title={member.hasManagedAvatar || member.avatarUrl ? copy.replacePhoto : copy.choosePhoto} loading={busy && !pending} disabled={busy} onPress={() => void choose()} />
    {member.hasManagedAvatar || member.avatarUrl ? <TextButton title={copy.removePhoto} disabled={busy} onPress={() => Alert.alert(copy.avatarRemoveTitle, copy.avatarRemoveMessage, [{ text: copy.cancel, style: 'cancel' }, { text: copy.removePhoto, style: 'destructive', onPress: () => void mutate(true) }])} /> : null}
    {message ? <AppText accessibilityRole="alert" accessibilityLiveRegion="polite" tone="error">{message}</AppText> : null}
    <Modal visible={viewer} presentationStyle="fullScreen" animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={() => setViewer(false)}>
      <SafeAreaView style={[styles.viewer, { backgroundColor: colors.background }]}>
        <TextButton title={copy.back} onPress={() => setViewer(false)} />
        <View style={styles.viewerImage}><MemberAvatar full member={member} size={Math.max(48, Math.min(window.width - 40, window.height - 160))} retryKey={retryKey} /></View>
        <AppText style={{ textAlign: 'center' }}>{member.fullName}</AppText>
      </SafeAreaView>
    </Modal>
  </AppCard>;
}
const styles = StyleSheet.create({ card: { gap: spacing.sm }, preview: { alignSelf: 'center', padding: spacing.xs, minHeight: 48 }, selectedPhoto: { width: '100%', height: 180, borderRadius: 16 }, viewer: { flex: 1, padding: spacing.lg, gap: spacing.md }, viewerImage: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
