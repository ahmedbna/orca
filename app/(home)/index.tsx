import { Map } from '@/components/map/map';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

export default function HomeScreen() {
  const course = useQuery(api.courses.getCourse);
  const streak = useQuery(api.wins.getCurrentStreak);

  if (course === undefined || streak === undefined) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spinner size='lg' variant='circle' color='#000000' />
      </View>
    );
  }

  if (course === null) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text>Course Not Found!</Text>
      </View>
    );
  }

  return <Map course={course} streak={streak} />;
}
