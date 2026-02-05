import { useLocalSearchParams } from 'expo-router';
import { Classroom } from '@/components/livekit/classroom';

export default function ClassroomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <Classroom />;
}
