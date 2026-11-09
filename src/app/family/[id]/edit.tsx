import { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, AppScreen } from '@/components/layout/app-screen';
import { ErrorState, LoadingState } from '@/components/feedback/states';
import { MemberForm } from '@/features/family/components/MemberForm';
import { familyApi } from '@/features/family/api/familyApi';
import type { FamilyMember } from '@/features/family/types/family';
import { memberErrorMessage } from '@/features/family/validation/familyValidation';

export default function EditFamilyMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const memberId = Number(id);
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setMember(await familyApi.get(memberId)); } catch (cause) { setError(memberErrorMessage(cause)); }
    finally { setLoading(false); }
  }, [memberId]);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <AppScreen padded centered><LoadingState label="Đang tải hồ sơ…" /></AppScreen>;
  if (!member) return <AppScreen padded><AppHeader title="Sửa thành viên" /><ErrorState title="Không thể mở hồ sơ" message={error || 'Không tìm thấy thành viên.'} retry={() => void load()} /></AppScreen>;
  return <AppScreen padded={false}><AppHeader title="Sửa thành viên" subtitle="Cập nhật thông tin thành viên." /><MemberForm member={member} onCancel={() => router.back()} onSaved={(saved) => router.replace({ pathname: '/family/[id]', params: { id: String(saved.id), notice: 'updated' } })} /></AppScreen>;
}
