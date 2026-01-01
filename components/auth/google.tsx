// components/auth/google.tsx
import { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { makeRedirectUri } from 'expo-auth-session';
import { openAuthSessionAsync } from 'expo-web-browser';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrcaButton } from '@/components/squishy/orca-button';

const redirectTo = makeRedirectUri();

export const SignInWithGoogle = () => {
  const { signIn } = useAuthActions();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);

    const { redirect } = await signIn('google', {
      redirectTo,
    });

    if (Platform.OS === 'web') {
      return;
    }

    const result = await openAuthSessionAsync(redirect!.toString(), redirectTo);

    if (result.type === 'success') {
      const { url } = result;
      const code = new URL(url).searchParams.get('code')!;
      await signIn('google', { code });
    } else {
      setLoading(false);
    }
  };

  return (
    <OrcaButton
      variant='white'
      onPress={handleGoogleSignIn}
      disabled={loading}
      loading={loading}
      label='Continue with Google'
      icon={<Ionicons name='logo-google' size={20} color='#000' />}
    />
  );
};
