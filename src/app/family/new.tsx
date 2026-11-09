import { router } from 'expo-router';
import { AppScreen, AppHeader } from '@/components/layout/app-screen';
import { MemberForm } from '@/features/family/components/MemberForm';
import type { FamilyMember } from '@/features/family/types/family';

export default function NewFamilyMemberScreen() {
  return <AppScreen padded={false}><AppHeader title="Thêm thành viên" subtitle="Thông tin sẽ được lưu vào cây gia đình của bạn." /><MemberForm onCancel={() => router.back()} onSaved={(member: FamilyMember) => router.replace({ pathname: '/family/[id]', params: { id: String(member.id), notice: 'created' } })} /></AppScreen>;
}
