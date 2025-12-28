import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { useLocalSearchParams } from 'expo-router';
import { Loading } from '@/components/loading';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { Profile } from '@/components/profile';

export default function StudentScreen() {
  const { id } = useLocalSearchParams<{ id: Id<'users'> }>();
  const user = useQuery(api.users.get, { userId: id });
  const userId = useQuery(api.users.getId);

  if (user === undefined || userId === undefined) {
    return <Loading />;
  }

  if (user === null || userId === null) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text>User Not Found</Text>
      </View>
    );
  }

  return <Profile user={user} userId={userId} />;
}
