// components/auth/auth.tsx
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Link } from '@/components/ui/link';
import { SignInWithGoogle } from '@/components/auth/google';
import { SignInWithApple } from '@/components/auth/apple';
import { Password } from '@/components/auth/password';
import { Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Jellyfish } from '@/components/orca/jellyfish';
import { Bubbles } from '@/components/orca/bubbles';
import { Clouds } from '@/components/orca/clouds';
import { Shark } from '@/components/orca/shark';
import { useColor } from '@/hooks/useColor';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const bubbles = [
  {
    speed: 40,
    count: 15,
    scale: 0.6,
    baseOpacity: 0.3,
    color: 'white',
    yRange: [0, SCREEN_HEIGHT] as [number, number],
  },
  {
    speed: 50,
    count: 14,
    scale: 1,
    baseOpacity: 0.5,
    color: 'white',
    yRange: [0, SCREEN_HEIGHT] as [number, number],
  },
  {
    speed: 60,
    count: 12,
    scale: 1.2,
    baseOpacity: 0.7,
    color: 'white',
    yRange: [0, SCREEN_HEIGHT] as [number, number],
  },
];

export const Auth = () => {
  const yellow = useColor('orca');
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: yellow }} pointerEvents='box-none'>
      <LinearGradient
        colors={[
          '#FAD40B',
          'rgba(250, 212, 11, 0.5)',
          'rgba(250, 212, 11, 0.01)',
        ]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: insets.top + 24,
          zIndex: 10,
        }}
      />

      {/* Background Elements */}
      <Clouds />
      <Bubbles layers={bubbles} />
      <Shark />
      <Jellyfish />

      <View
        style={{
          position: 'absolute',
          top: insets.top + 24,
          left: 0,
          right: 0,
          gap: 16,
          paddingHorizontal: 16,
        }}
      >
        <KeyboardAwareScrollView
          bottomOffset={24}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: -36,
              marginBottom: -46,
            }}
          >
            <Image
              source={require('@/assets/images/icon.png')}
              style={{ width: 190, height: 190 }}
              contentFit='contain'
            />
          </View>

          <Password />
        </KeyboardAwareScrollView>

        <View style={{ gap: 16 }}>
          <SignInWithGoogle />
          <SignInWithApple />
        </View>

        <View style={{ paddingHorizontal: 32, marginTop: 4 }}>
          <Text style={{ fontSize: 16, textAlign: 'center', color: '#000' }}>
            By continuing, you agree to our{'\n'}
            <Link href='https://orca.ahmedbna.com/terms'>
              <Text variant='link' style={{ fontSize: 14, color: '#000' }}>
                Terms of Service
              </Text>
            </Link>{' '}
            and{' '}
            <Link href='https://orca.ahmedbna.com/privacy'>
              <Text variant='link' style={{ fontSize: 14, color: '#000' }}>
                Privacy Policy
              </Text>
            </Link>
          </Text>
        </View>
      </View>
    </View>
  );
};
