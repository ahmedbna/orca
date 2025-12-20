import { Slot } from 'expo-router';
import { Background } from '@/components/background';

export default function HomeLayout() {
  return (
    <Background>
      <Slot />
    </Background>
  );
}
