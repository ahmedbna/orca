// components/auth/apple.tsx

import { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { makeRedirectUri } from 'expo-auth-session';
import { openAuthSessionAsync } from 'expo-web-browser';
import { Platform, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const redirectTo = makeRedirectUri();
const SHADOW_HEIGHT = 8;

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style);
  }
};

export const SignInWithApple = () => {
  const { signIn } = useAuthActions();
  const [loading, setLoading] = useState(false);
  const pressed = useSharedValue(0);

  const handleAppleSignIn = async () => {
    setLoading(true);

    const { redirect } = await signIn('apple', {
      redirectTo,
    });

    if (Platform.OS === 'web') {
      return;
    }

    const result = await openAuthSessionAsync(redirect!.toString(), redirectTo);

    if (result.type === 'success') {
      const { url } = result;
      const code = new URL(url).searchParams.get('code')!;
      await signIn('apple', { code });
    } else {
      setLoading(false);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(pressed.value, [0, 1], [0, SHADOW_HEIGHT]);
    return { transform: [{ translateY }] };
  });

  return (
    <Pressable
      disabled={loading}
      onPress={handleAppleSignIn}
      onPressIn={() => {
        pressed.value = withSpring(1, { damping: 15 });
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 15 });
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      }}
      style={{ height: 64, width: '100%', opacity: loading ? 0.6 : 1 }}
    >
      {/* Shadow */}
      <View
        pointerEvents='none'
        style={{
          backgroundColor: '#2A2A2A',
          position: 'absolute',
          top: SHADOW_HEIGHT,
          left: 0,
          right: 0,
          height: 64,
          borderRadius: 999,
          zIndex: 1,
        }}
      />

      {/* Face */}
      <Animated.View
        pointerEvents='none'
        style={[
          {
            backgroundColor: '#000000',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 64,
            borderRadius: 999,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2,
            borderWidth: 4,
            borderColor: 'rgba(255,255,255,0.1)',
            flexDirection: 'row',
            gap: 12,
          },
          animatedStyle,
        ]}
      >
        <Ionicons name='logo-apple' size={20} color='#FFF' />
        <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '800' }}>
          {loading ? 'Loading...' : 'Continue with Apple'}
        </Text>
      </Animated.View>
    </Pressable>
  );
};
