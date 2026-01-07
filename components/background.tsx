// components/background.tsx
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Doc } from '@/convex/_generated/dataModel';
import { useColor } from '@/hooks/useColor';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { Text } from '@/components/ui/text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Jellyfish } from '@/components/orca/jellyfish';
import { Bubbles } from '@/components/orca/bubbles';
import { Clouds } from '@/components/orca/clouds';
import { Shark } from '@/components/orca/shark';
import { Seafloor } from '@/components/orca/seafloor';
import { View } from '@/components/ui/view';
import { setAudioModeAsync } from 'expo-audio';

export const Background = ({
  user,
  swim = false,
  children,
}: {
  user?: Doc<'users'>;
  swim?: boolean;
  children: React.ReactNode;
}) => {
  const yellow = useColor('orca');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mute, setMute] = useState(false);

  // Use the background music hook
  const { isSpeechRoute } = useBackgroundMusic(mute);

  // 🔥 NEW: Reset audio session when entering speech routes
  useEffect(() => {
    if (isSpeechRoute) {
      const resetAudioForSpeech = async () => {
        try {
          await setAudioModeAsync({
            playsInSilentMode: true,
            allowsRecording: false,
            shouldPlayInBackground: false,
            interruptionMode: 'duckOthers',
            shouldRouteThroughEarpiece: false,
          });
          console.log(
            '✅ Background: Audio session configured for speech route'
          );
        } catch (err) {
          console.warn('⚠️ Background: Audio session config failed:', err);
        }
      };

      // Small delay to ensure previous audio is cleaned up
      const timer = setTimeout(resetAudioForSpeech, 100);
      return () => clearTimeout(timer);
    }
  }, [isSpeechRoute]);

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
          height: insets.top + 120,
          zIndex: 10,
        }}
      />

      {/* Header */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: insets.top + 4,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20,
        }}
      >
        <Button
          variant='ghost'
          style={{
            padding: 0,
            paddingHorizontal: 0,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          onPress={() => {
            if (router.canDismiss()) {
              router.dismissAll();
            }
          }}
        >
          <Image
            source={require('@/assets/images/icon.png')}
            style={{ width: 62, height: 62 }}
            contentFit='contain'
          />
          <Text
            variant='heading'
            style={{ color: '#000', fontSize: 32, marginLeft: -6 }}
          >
            Orca
          </Text>
        </Button>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {!isSpeechRoute && (
            <Button
              size='icon'
              variant='ghost'
              onPress={() => setMute((prev) => !prev)}
            >
              <Text style={{ fontSize: 36 }}>{mute ? '🔇' : '🔊'}</Text>
            </Button>
          )}

          <Avatar
            size={42}
            image={user?.image}
            name={user?.name}
            onPress={() => router.push('/profile')}
          />
        </View>
      </View>

      {/* Background Elements */}
      <Clouds />
      <Bubbles />
      <Shark />
      <Jellyfish />
      <Seafloor speed={swim ? 5000 : 0} bottom={insets.bottom + 240} />

      <View
        style={{
          paddingBottom: insets.bottom,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#F6C90E',
          paddingHorizontal: 16,
          height: insets.bottom + 240,
          zIndex: 44,
        }}
      />

      {children}
    </View>
  );
};
