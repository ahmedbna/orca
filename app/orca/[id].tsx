import { Orca } from '@/components/orca/orca';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { useLocalSearchParams } from 'expo-router';
import { Loading } from '@/components/loading';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { Onboarding } from '@/components/onboarding/onboarding';
import { usePiperTTS } from '@/hooks/usePiperTTS';
import { Colors } from '@/theme/colors';
import { Spinner } from '@/components/ui/spinner';
import { OrcaGame } from './orca-game';

export default function OrcaScreen() {
  const { id } = useLocalSearchParams<{ id: Id<'lessons'> }>();
  const user = useQuery(api.users.get, {});
  const { availableModels } = usePiperTTS();

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
    !user.birthday ||
    !user.nativeLanguage ||
    !user.learningLanguage ||
    availableModels.length === 0 ? (
    <Onboarding user={user} />
  ) : (
    <OrcaGame lessonId={id} />
  );
}
