// hooks/useBackgroundMusic.ts

import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { setAudioModeAsync } from 'expo-audio';

const audioSource = require('@/assets/music/orca.mp3');

export function useBackgroundMusic(mute: boolean) {
  const pathname = usePathname();
  const playerRef = useRef<ReturnType<typeof useAudioPlayer> | null>(null);

  const isOrcaRoute = pathname.startsWith('/orca/');
  const isStudyRoute = pathname.includes('/study/');
  const isSpeechRoute = isOrcaRoute || isStudyRoute;

  // Always create the player (don't conditionally create it)
  const player = useAudioPlayer(audioSource);

  // Store player reference
  if (player && !playerRef.current) {
    playerRef.current = player;
  }

  useEffect(() => {
    const currentPlayer = playerRef.current;
    if (!currentPlayer) return;

    const stopMusicAndConfigureTTS = async () => {
      try {
        // Stop music safely
        try {
          await currentPlayer.pause();
          currentPlayer.volume = 0;
        } catch (err) {
          // Ignore if player is already stopped
        }

        // Configure audio session for TTS
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
          shouldPlayInBackground: false,
          interruptionMode: 'duckOthers',
          shouldRouteThroughEarpiece: false,
        });

        console.log('✅ Audio configured for speech route');
      } catch (err) {
        console.warn('⚠️ Speech audio setup error:', err);
      }
    };

    const playBackgroundMusic = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
          shouldPlayInBackground: false,
          interruptionMode: 'mixWithOthers',
          shouldRouteThroughEarpiece: false,
        });

        currentPlayer.loop = true;
        currentPlayer.volume = 0.5;
        await currentPlayer.play();

        console.log('🎵 Background music playing');
      } catch (err) {
        console.warn('🎵 Background music error:', err);
      }
    };

    // Handle state changes
    if (isSpeechRoute || mute) {
      stopMusicAndConfigureTTS();
    } else {
      playBackgroundMusic();
    }

    // Cleanup on unmount or route change
    return () => {
      try {
        currentPlayer.pause();
        currentPlayer.volume = 0;
      } catch (err) {
        // Ignore cleanup errors
      }
    };
  }, [mute, isSpeechRoute]);

  return { isSpeechRoute };
}
