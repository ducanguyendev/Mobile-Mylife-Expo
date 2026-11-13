import { useState } from 'react';
import { useAuth } from '@/features/auth/context/auth-provider';
import { TimelineScreen } from '@/features/timeline/TimelineScreen';
import { AnniversaryScreen } from './AnniversaryScreen';

export function MemoriesScreen() {
  const { user } = useAuth();
  return <MemoriesModules key={`${user?.id ?? 'anonymous'}:${user?.role ?? ''}`} />;
}
function MemoriesModules() {
  const [calendar, setCalendar] = useState(false);
  return calendar ? <AnniversaryScreen onTimeline={() => setCalendar(false)} />
    : <TimelineScreen onCalendar={() => setCalendar(true)} />;
}
