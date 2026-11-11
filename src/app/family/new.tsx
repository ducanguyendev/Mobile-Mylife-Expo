import { router } from 'expo-router';
import { AppScreen } from '@/components/layout/app-screen';
import { useAuth } from '@/features/auth/context/auth-provider';
import { MemberForm } from '@/features/family/components/MemberForm';
import { FamilyHeader, backToFamily } from '@/features/family/components/FamilyHeader';
import { useFamilyStrings } from '@/features/family/i18n/use-family-strings';
export default function NewFamilyMemberScreen() {
  const { user, isUser } = useAuth(); const { copy } = useFamilyStrings();
  if (!user || !isUser) return null;
  return <AppScreen padded={false}><FamilyHeader title={copy.add} /><MemberForm key={user.id} onCancel={backToFamily} onSaved={member => router.replace({ pathname: '/family/[id]', params: { id: String(member.id) } })} /></AppScreen>;
}
