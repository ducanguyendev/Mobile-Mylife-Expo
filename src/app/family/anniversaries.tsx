import { useLocalSearchParams } from 'expo-router';
import { AnniversaryScreen } from '@/features/anniversaries/AnniversaryScreen';

export default function AnniversaryRoute() {
  const { memberId, anniversaryId } = useLocalSearchParams<{ memberId?: string; anniversaryId?: string }>();
  const id = (value: string | undefined) => value === undefined ? undefined : /^[1-9]\d*$/.test(value) ? Number(value) : NaN;
  return <AnniversaryScreen memberId={id(memberId)} anniversaryId={id(anniversaryId)} canGoBack />;
}
