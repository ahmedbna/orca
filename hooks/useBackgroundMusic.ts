// hooks/useBackgroundMusic.ts

import { useEffect, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { setAudioModeAsync } from 'expo-audio';
import { usePathname } from 'expo-router';

const audioSource = require('@/assets/music/orca.mp3');

export function useBackgroundMusic(mute: boolean) {
  const pathname = usePathname();
  const isOrcaRoute = pathname.startsWith('/orca/');
  const isStudyRoute = pathname.startsWith('/study/');
  const isSpeechRoute = isOrcaRoute || isStudyRoute;

  // Only create player when NOT on speech routes
  const player = useAudioPlayer(isSpeechRoute ? null : audioSource);
  const hasConfiguredSessionRef = useRef(false);

  // Configure audio session based on route
  useEffect(() => {
    const configureAudioSession = async () => {
      try {
        if (isSpeechRoute) {
          await setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: false,
          });
          hasConfiguredSessionRef.current = true;
          console.log('🎤 Audio session: Speech/Recording mode');
        } else {
          await setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
          });
          hasConfiguredSessionRef.current = true;
          console.log('🎵 Audio session: Music playback mode');
        }
      } catch (error) {
        console.warn('Audio session config error:', error);
      }
    };

    configureAudioSession();
  }, [isSpeechRoute]);

  // Manage playback
  useEffect(() => {
    if (isSpeechRoute || !player || mute) {
      // Stop music on speech routes or when muted
      if (player) {
        try {
          player.pause();
        } catch (error) {
          // Player might not exist
        }
      }
      return;
    }

    const startMusic = async () => {
      try {
        // Wait for audio session to be configured
        if (!hasConfiguredSessionRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        player.loop = true;
        player.volume = 0.3;
        await player.play();
        console.log('🎵 Background music playing');
      } catch (error) {
        console.warn('Error playing music:', error);
      }
    };

    startMusic();

    return () => {
      if (player) {
        try {
          player.pause();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [isSpeechRoute, mute, player]);

  return { isSpeechRoute };
}
