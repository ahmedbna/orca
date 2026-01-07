// hooks/useBackgroundMusic.ts

import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { setAudioModeAsync } from 'expo-audio';

const audioSource = require('@/assets/music/orca.mp3');

export function useBackgroundMusic(mute: boolean) {
  const pathname = usePathname();
  const isPlayingRef = useRef(false);
  const playerRef = useRef<ReturnType<typeof useAudioPlayer> | null>(null);

  const isOrcaRoute = pathname.startsWith('/orca/');
  const isStudyRoute = pathname.includes('/study/');
  const isSpeechRoute = isOrcaRoute || isStudyRoute;

  // Create player only once
  const player = useAudioPlayer(audioSource);

  // Store player reference
  if (player && !playerRef.current) {
    playerRef.current = player;
  }

  useEffect(() => {
    const currentPlayer = playerRef.current;
    if (!currentPlayer) return;

    const stopMusic = async () => {
      if (!isPlayingRef.current) return;

      try {
        await currentPlayer.pause();
        currentPlayer.volume = 0;
        await currentPlayer.release();
        isPlayingRef.current = false;
        console.log('🎵 Background music stopped');
      } catch (err) {
        console.warn('⚠️ Error stopping music:', err);
      }
    };

    const playBackgroundMusic = async () => {
      // Don't play if already playing
      if (isPlayingRef.current) return;

      try {
        // Configure audio session for background music
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
        isPlayingRef.current = true;

        console.log('🎵 Background music playing');
      } catch (err) {
        console.warn('🎵 Background music error:', err);
        isPlayingRef.current = false;
      }
    };

    // Handle state changes
    if (isSpeechRoute || mute) {
      stopMusic();
    } else {
      playBackgroundMusic();
    }

    // Cleanup on unmount
    return () => {
      stopMusic();
    };
  }, [mute, isSpeechRoute]);

  return { isSpeechRoute };
}
