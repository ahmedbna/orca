import { Level } from '@/components/level/level';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { useLocalSearchParams } from 'expo-router';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { Colors } from '@/theme/colors';

export default function LevelScreen() {
  const { id } = useLocalSearchParams<{ id: Id<'lessons'> }>();
  const lesson = useQuery(api.lessons.get, { lessonId: id });

  if (lesson === undefined) {
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

  if (
    lesson === null ||
    !lesson.user.nativeLanguage ||
    !lesson.user.learningLanguage
  ) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.dark.orca,
        }}
      >
        <Text>Lesson Not Found</Text>
      </View>
    );
  }

  return <Level lesson={lesson} />;
}
