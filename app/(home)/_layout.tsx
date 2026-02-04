// app/(home)/_layout.tsx

import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { Background } from '@/components/background';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { api } from '@/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { Onboarding } from '@/components/onboarding/onboarding';
import { Colors } from '@/theme/colors';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from 'react-native';
import { SherpaVolumeSilencer } from '@/hooks/SherpaVolumeSilencer';
import Purchases from 'react-native-purchases';

export default function HomeLayout() {
  const user = useQuery(api.users.get, {});
  const checkAndCancelDeletion = useMutation(
    api.userDeletion.checkAndCancelDeletionOnLogin,
  );
  const models = useQuery(api.piperModels.getAll);

  // Check and cancel deletion on mount
  useEffect(() => {
    const checkDeletion = async () => {
      if (user) {
        try {
          const result = await checkAndCancelDeletion();

          if (result.cancelled) {
            Alert.alert(
              '🎉 Welcome Back!',
              "Your account deletion has been cancelled. We're happy to have you back!",
              [{ text: 'OK', style: 'default' }],
            );
          }
        } catch (error) {
          console.error('Error checking deletion status:', error);
        }
      }
    };

    checkDeletion();
  }, [user?._id]);

  // Set RevenueCat user ID when user is loaded
  useEffect(() => {
    const setRevenueCatUserId = async () => {
      if (user?._id) {
        try {
          // Login to RevenueCat with user ID
          await Purchases.logIn(user._id);
          console.log('✅ RevenueCat user ID set:', user._id);

          // Optionally set user attributes for analytics
          await Purchases.setAttributes({
            email: user.email || '',
            name: user.name || '',
          });
        } catch (error) {
          console.error('❌ Failed to set RevenueCat user ID:', error);
        }
      }
    };

    setRevenueCatUserId();
  }, [user?._id, user?.email, user?.name]);

  if (user === undefined || models === undefined) {
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

  return !user.nativeLanguage || !user.learningLanguage ? (
    <Onboarding user={user} models={models} />
  ) : (
    <Background user={user}>
      <SherpaVolumeSilencer />
      <Slot />
    </Background>
  );
}
