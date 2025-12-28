import { Profile } from '@/components/profile';
import { Loading } from '@/components/loading';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

export default function ProfileScreen() {
  const user = useQuery(api.users.get, {});
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
