import { Slot } from 'expo-router';
import { Background } from '@/components/background';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

export default function HomeLayout() {
  const user = useQuery(api.users.get);

  if (user === null) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text>User Not Found!</Text>
      </View>
    );
  }

  return (
    <Background user={user}>
      <Slot />
    </Background>
  );
}
