import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import { useVideoPlayer, VideoView } from 'expo-video';
const videoSource = require('@/assets/videos/swim.mp4');

export const Loading = () => {
  const orca = useColor('orca');

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
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: orca,
      }}
    >
      <VideoView
        player={player}
        fullscreenOptions={{ enable: false }}
        allowsPictureInPicture={false}
        nativeControls={false}
        contentFit='cover'
        style={{ width: 200, height: 200 * 0.6 }}
      />
    </View>
  );
};
