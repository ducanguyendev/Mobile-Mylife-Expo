import { useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AppScreen } from '@/components/layout/app-screen';
import { ErrorState, LoadingState } from '@/components/feedback/states';
import { MemberForm } from '@/features/family/components/MemberForm';
import { FamilyHeader, backToFamily } from '@/features/family/components/FamilyHeader';
import { useAuth } from '@/features/auth/context/auth-provider';
import { familyDataApi } from '@/features/family/api/familyDataApi';
import { familyError } from '@/features/family/data/family-errors';
import { useFamilyQuery } from '@/features/family/data/use-family-query';
import { useFamilyStrings } from '@/features/family/i18n/use-family-strings';
export default function EditFamilyMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const memberId = Number(id);
  const { user, isUser } = useAuth(); const { copy } = useFamilyStrings();
  if (!user || !isUser) return null;
  if (!Number.isSafeInteger(memberId) || memberId <= 0 || memberId > 2147483647) return <AppScreen><FamilyHeader title={copy.edit} /><ErrorState title={copy.loadError} message={copy.notFound} /></AppScreen>;
  return <EditMember key={`${user.id}:${memberId}`} accountId={user.id} memberId={memberId} />;
}
function EditMember({ accountId, memberId }: { accountId: number; memberId: number }) {
  const { copy } = useFamilyStrings(); const loader = useCallback((signal: AbortSignal) => familyDataApi.get(memberId, signal), [memberId]);
  const query = useFamilyQuery(accountId, `edit:${memberId}`, loader, false);
  return <AppScreen padded={false}><FamilyHeader title={copy.edit} />
    {query.data ? <MemberForm key={`${query.data.id}:${query.data.updatedAt}`} member={query.data} onReload={() => void query.reload()} onCancel={backToFamily} onSaved={member => router.dismissTo({ pathname: '/family/[id]', params: { id: String(member.id) } })} />
      : query.status === 'error' ? <ErrorState title={copy.loadError} message={familyError(query.error, copy)} retry={() => void query.reload()} /> : <LoadingState />}
  </AppScreen>;
}
