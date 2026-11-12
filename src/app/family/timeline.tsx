import { useLocalSearchParams } from 'expo-router';
import { TimelineScreen } from '@/features/timeline/TimelineScreen';
export default function MemberTimelineRoute() {
  const { memberId } = useLocalSearchParams<{ memberId?: string }>();
  const id = memberId === undefined ? undefined : /^[1-9]\d*$/.test(memberId) ? Number(memberId) : NaN;
  return <TimelineScreen memberId={id} canGoBack />;
}
