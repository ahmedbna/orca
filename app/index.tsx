import { Map } from '@/components/map/map';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { api } from '@/convex/_generated/api';
import { Colors } from '@/theme/colors';
import { useQuery } from 'convex/react';

export default function HomeScreen() {
  const course = useQuery(api.courses.getCourse);

  if (course === undefined) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.dark.orca,
        }}
      >
        <Spinner size='lg' variant='circle' />
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
          backgroundColor: Colors.dark.orca,
        }}
      >
        <Text>Course Not Found!</Text>
      </View>
    );
  }

  return <Map course={course} />;
}
