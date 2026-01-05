import { Study } from '@/components/study';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { useLocalSearchParams } from 'expo-router';
import { Loading } from '@/components/loading';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { Colors } from '@/theme/colors';

export default function StudyScreen() {
  const { id } = useLocalSearchParams<{ id: Id<'lessons'> }>();
  const lesson = useQuery(api.lessons.get, { lessonId: id });
  const models = useQuery(api.piperModels.getAll);

  if (lesson === undefined || models === undefined) {
    return <Loading />;
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
        }}
      >
        <Text>Lesson Not Found</Text>
      </View>
    );
  }

  return (
    <Study
      models={models}
      lesson={lesson}
      language={lesson.user.learningLanguage}
      native={lesson.user.nativeLanguage}
    />
  );
}
