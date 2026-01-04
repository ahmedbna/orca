import { Map } from '@/components/map/map';
import { Loading } from '@/components/loading';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

export default function HomeScreen() {
  const homeData = useQuery(api.home.getHomeData);

  if (homeData === undefined) {
    return <Loading />;
  }

  if (homeData === null) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text>Course Not Found</Text>
      </View>
    );
  }

  return <Map course={homeData.course} streak={homeData.streak} />;
}
