// app/(home)/_layout.tsx

import { Slot } from 'expo-router';
import { Background } from '@/components/background';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { Onboarding } from '@/components/onboarding/onboarding';
import { Colors } from '@/theme/colors';
import { Spinner } from '@/components/ui/spinner';

export default function HomeLayout() {
  const user = useQuery(api.users.get, {});

  if (user === undefined) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.dark.orca,
        }}
      >
        <Spinner size='lg' variant='circle' color='#000000' />
      </View>
    );
  }

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

  return !user.gender ||
    !user.bio ||
    !user.birthday ||
    !user.nativeLanguage ||
    !user.learningLanguage ? (
    <Onboarding />
  ) : (
    <Background user={user}>
      <Slot />
    </Background>
  );
}
