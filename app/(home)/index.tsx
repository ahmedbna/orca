import { useEffect, useRef, useState } from 'react';
import { Map } from '@/components/map/map';
import { Loading } from '@/components/loading';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useAudioPlayer } from 'expo-audio';
import { setAudioModeAsync } from 'expo-audio';
import { Button } from '@/components/ui/button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const audioSource = require('@/assets/music/orca.mp3');

export default function HomeScreen() {
  const homeData = useQuery(api.home.getHomeData);
  const insets = useSafeAreaInsets();
  const isPlayingRef = useRef(false);
  const player = useAudioPlayer(audioSource);
  const [mute, setMute] = useState(false);

  useEffect(() => {
    const playBackgroundMusic = async () => {
      if (isPlayingRef.current) return;

      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
          shouldPlayInBackground: false,
          interruptionMode: 'mixWithOthers',
          shouldRouteThroughEarpiece: false,
        });

        player.loop = true;
        player.volume = 0.5;
        await player.play();
        isPlayingRef.current = true;

        console.log('🎵 Background music playing on home screen');
      } catch (err) {
        console.warn('🎵 Background music error:', err);
        isPlayingRef.current = false;
      }
    };

    const stopMusic = async () => {
      if (!isPlayingRef.current) return;

      try {
        await player.pause();
        player.volume = 0;
        await player.release();
        isPlayingRef.current = false;
        console.log('🎵 Background music stopped');
      } catch (err) {
        console.warn('⚠️ Error stopping music:', err);
      }
    };

    // Handle mute state
    if (mute) {
      stopMusic();
    } else {
      playBackgroundMusic();
    }

    // Stop music when component unmounts (navigating away)
    return () => {
      stopMusic();
    };
  }, [player, mute]);

  if (homeData === undefined) {
    return <Loading />;
  }

  if (homeData === null) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text>Course Not Found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Mute Button - Positioned in top right */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 4,
          right: 68,
          zIndex: 30,
        }}
      >
        <Button size='icon' variant='ghost' onPress={() => setMute(!mute)}>
          <Text style={{ fontSize: 36 }}>{mute ? '🔇' : '🔊'}</Text>
        </Button>
      </View>

      <Map course={homeData.course} streak={homeData.streak} />
    </View>
  );
}
