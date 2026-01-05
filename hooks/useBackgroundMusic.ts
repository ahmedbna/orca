// hooks/useBackgroundMusic.ts

import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';

const audioSource = require('@/assets/music/orca.mp3');

export function useBackgroundMusic(mute: boolean) {
  const pathname = usePathname();

  const isOrcaRoute = pathname.startsWith('/orca/');
  const isStudyRoute = pathname.startsWith('/study/');
  const isSpeechRoute = isOrcaRoute || isStudyRoute;

  // IMPORTANT:
  // Player exists ONLY when NOT on speech routes
  const player = useAudioPlayer(isSpeechRoute ? null : audioSource);

  useEffect(() => {
    if (!player) return;

    if (mute || isSpeechRoute) {
      try {
        player.pause();
      } catch {}
      return;
    }

    try {
      player.loop = true;
      player.volume = 0.3;
      player.play();
    } catch (err) {
      console.warn('🎵 Background music error:', err);
    }

    return () => {
      try {
        player.pause();
      } catch {}
    };
  }, [player, mute, isSpeechRoute]);

  return { isSpeechRoute };
}
