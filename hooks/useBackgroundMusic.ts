// hooks/useBackgroundMusic.ts

import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { setAudioModeAsync } from 'expo-audio';

const audioSource = require('@/assets/music/orca.mp3');

export function useBackgroundMusic(mute: boolean) {
  const pathname = usePathname();
  const isOrcaRoute = pathname.startsWith('/orca/');
  const isStudyRoute = pathname.startsWith('/study/');
  const isSpeechRoute = isOrcaRoute || isStudyRoute;

  // Only create player when NOT on speech routes
  const player = useAudioPlayer(isSpeechRoute ? null : audioSource);
  const hasConfiguredSessionRef = useRef(false);
  const audioSessionTimeoutRef = useRef<number | null>(null);

  // Configure audio session based on route
  useEffect(() => {
    const configureAudioSession = async () => {
      // Clear any pending timeouts
      if (audioSessionTimeoutRef.current) {
        clearTimeout(audioSessionTimeoutRef.current);
        audioSessionTimeoutRef.current = null;
      }

      try {
        if (isSpeechRoute) {
          // CRITICAL: Configure for TTS/Speech Recognition
          // This mode is compatible with Sherpa-ONNX TTS
          await setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: false,
            allowsRecording: true, // Allow TTS to work
            interruptionMode: 'duckOthers', // Mix with other audio
            shouldRouteThroughEarpiece: false,
          });
          hasConfiguredSessionRef.current = true;
          console.log('🎤 Audio session: Speech/TTS mode (mixable)');
        } else {
          // Add a small delay before switching to music mode
          // This ensures TTS has fully released the audio session
          audioSessionTimeoutRef.current = setTimeout(async () => {
            try {
              await setAudioModeAsync({
                playsInSilentMode: true,
                shouldPlayInBackground: true,
                allowsRecording: false,
                interruptionMode: 'duckOthers', // Don't interrupt other apps
                shouldRouteThroughEarpiece: false,
              });
              hasConfiguredSessionRef.current = true;
              console.log('🎵 Audio session: Music playback mode');
            } catch (error) {
              console.warn('Audio session config error (delayed):', error);
            }
          }, 300); // 300ms delay
        }
      } catch (error) {
        console.warn('Audio session config error:', error);
      }
    };

    configureAudioSession();

    return () => {
      if (audioSessionTimeoutRef.current) {
        clearTimeout(audioSessionTimeoutRef.current);
        audioSessionTimeoutRef.current = null;
      }
    };
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
          await new Promise((resolve) => setTimeout(resolve, 500));
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
