import { useEffect, useRef, useState } from 'react';
import { Image, type ImageSource } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '@/design-system/components/avatar';
import { useAuth } from '@/features/auth/context/auth-provider';
import type { FamilyMember } from '../types/family';
import { probeAvatarSession, readAvatarSource } from '../avatar/avatar-transport';
import { useFamilyStrings } from '../i18n/use-family-strings';

type AvatarMember = Pick<FamilyMember, 'id' | 'fullName' | 'hasManagedAvatar' | 'updatedAt'>;
export function MemberAvatar({ member, size = 48, retryKey = 0, full = false, onUnavailable }: { member: AvatarMember; size?: number; retryKey?: number; full?: boolean; onUnavailable?: () => void }) {
  const { user } = useAuth();
  return <ScopedMemberAvatar key={`${user?.id}:${member.id}:${member.updatedAt}:${retryKey}`} accountId={user?.id ?? 0} member={member} size={size} full={full} onUnavailable={onUnavailable} />;
}
function ScopedMemberAvatar({ accountId, member, size, full, onUnavailable }: { accountId: number; member: AvatarMember; size: number; full: boolean; onUnavailable?: () => void }) {
  const { copy } = useFamilyStrings();
  const [source, setSource] = useState<ImageSource>();
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const active = useRef(false);
  const retried = useRef(false);
  const unavailable = useRef(onUnavailable);
  useEffect(() => { unavailable.current = onUnavailable; }, [onUnavailable]);
  useEffect(() => {
    active.current = true;
    if (member.hasManagedAvatar && accountId > 0) {
      void readAvatarSource(accountId, member.id, member.updatedAt).then(value => { if (active.current) setSource(value); }).catch(() => { if (active.current) unavailable.current?.(); });
    }
    return () => { active.current = false; };
  }, [accountId, member.hasManagedAvatar, member.id, member.updatedAt]);
  const failed = async () => {
    if (!active.current) return;
    setLoaded(false);
    if (!retried.current) {
      retried.current = true;
      try {
        await probeAvatarSession();
        const next = await readAvatarSource(accountId, member.id, member.updatedAt);
        if (active.current) { setSource(next); setAttempt(value => value + 1); }
        return;
      } catch { /* Existing auth layer owns invalidation and feedback. */ }
    }
    if (active.current) { setSource(undefined); unavailable.current?.(); }
  };
  return <View accessible accessibilityRole="image" accessibilityLabel={copy.imageLabel(member.fullName)} style={{ width: size, height: size }}>
    <View importantForAccessibility="no-hide-descendants" style={{ opacity: loaded ? 0 : 1 }}><Avatar name={member.fullName} size={size} /></View>
    {source ? <Image key={attempt} source={source} cachePolicy="none" recyclingKey={`${accountId}:${member.id}:${member.updatedAt}:${attempt}`} contentFit={full ? "contain" : "cover"}
      accessible={false} importantForAccessibility="no-hide-descendants" onLoad={() => setLoaded(true)} onError={() => void failed()}
      style={[StyleSheet.absoluteFill, { width: size, height: size, borderRadius: full ? 0 : size / 2, opacity: loaded ? 1 : 0 }]} /> : null}
  </View>;
}
