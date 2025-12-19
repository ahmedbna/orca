import { useEffect } from 'react';
import { View } from '@/components/ui/view';
import { useAudioPlayer } from 'expo-audio';

const audioSource = require('@/assets/music/orca.mp3');

export const Music = () => {
  const player = useAudioPlayer(audioSource);

  // Handle audio playback based on game state
  useEffect(() => {
    const handleAudio = async () => {
      if (!player) return;

      if (player.isLoaded) {
        try {
          if (player.playing) {
            await player.seekTo(0);
          } else {
            await player.play();
          }
        } catch (error) {
          console.error('Error playing audio:', error);
        }
      } else {
        try {
          if (player.playing) {
            await player.pause();
            await player.seekTo(0);
          }
        } catch (error) {
          console.error('Error stopping audio:', error);
        }
      }
    };

    handleAudio();
  }, [player]);

  return <View />;
};
