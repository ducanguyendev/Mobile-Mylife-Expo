import { useLocalSearchParams } from 'expo-router';
import { AppScreen } from '@/components/layout/app-screen';
import { ErrorState } from '@/components/feedback/states';
import { useAuth } from '@/features/auth/context/auth-provider';
import { FamilyHeader } from '@/features/family/components/FamilyHeader';
import { MemberProfile } from '@/features/family/components/MemberProfile';
import { useFamilyStrings } from '@/features/family/i18n/use-family-strings';
export default function FamilyMemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const memberId = Number(id);
  const { user, isUser } = useAuth(); const { copy } = useFamilyStrings();
  if (!user || !isUser) return null;
  if (!Number.isSafeInteger(memberId) || memberId <= 0 || memberId > 2147483647) return <AppScreen><FamilyHeader title={copy.profile} /><ErrorState title={copy.loadError} message={copy.notFound} /></AppScreen>;
  return <MemberProfile key={`${user.id}:${memberId}`} accountId={user.id} memberId={memberId} />;
}
