// app/orca/_layout.tsx

import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { api } from '@/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { Onboarding } from '@/components/onboarding/onboarding';
import { Colors } from '@/theme/colors';
import { Spinner } from '@/components/ui/spinner';
import { usePiperTTS } from '@/hooks/usePiperTTS';
import { Alert } from 'react-native';

export default function HomeLayout() {
  const user = useQuery(api.users.get, {});
  const { availableModels } = usePiperTTS();
  const checkAndCancelDeletion = useMutation(
    api.userDeletion.checkAndCancelDeletionOnLogin
  );

  // Check and cancel deletion on mount
  useEffect(() => {
    const checkDeletion = async () => {
      if (user) {
        try {
          const result = await checkAndCancelDeletion();

          if (result.cancelled) {
            // Show a welcome back message
            Alert.alert(
              '🎉 Welcome Back!',
              "Your account deletion has been cancelled. We're happy to have you back!",
              [{ text: 'OK', style: 'default' }]
            );
          }
        } catch (error) {
          console.error('Error checking deletion status:', error);
        }
      }
    };

    checkDeletion();
  }, [user?._id]); // Only run when user ID changes

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
    <Slot />
  );
}
