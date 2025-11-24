import { ViewStyle } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
const videoSource = require('../../assets/videos/fish.mp4');

interface VideoProps {
  style?: ViewStyle;
}

export const Fish = ({ style }: VideoProps) => {
  const player = useVideoPlayer(videoSource, (player) => {
    try {
      if (player.play) player.play();
      player.loop = true;
      player.muted = true;
    } catch (error) {
      console.error('Video player initialization error:', error);
    }
  });

  return (
    <VideoView
      player={player}
      fullscreenOptions={{ enable: false }}
      allowsPictureInPicture={false}
      nativeControls={false}
      contentFit='cover'
      style={style}
    />
  );
};
