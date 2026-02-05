import { TrackReference, useLocalParticipant } from '@livekit/components-react';
import { BarVisualizer } from '@livekit/react-native';
import {
  Camera,
  CameraOff,
  MessageCircle,
  MessageCircleOff,
  Mic2,
  MicOff,
  PhoneOff,
  ScreenShare,
  ScreenShareOff,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ViewStyle,
  StyleSheet,
  View,
  TouchableOpacity,
  StyleProp,
} from 'react-native';

type ControlBarProps = {
  style?: StyleProp<ViewStyle>;
  options: ControlBarOptions;
};

type ControlBarOptions = {
  isMicEnabled: boolean;
  onMicClick: () => void;
  isCameraEnabled: boolean;
  onCameraClick: () => void;
  isScreenShareEnabled: boolean;
  onScreenShareClick: () => void;
  isChatEnabled: boolean;
  onChatClick: () => void;
  onExitClick: () => void;
};

export default function ControlBar({ style = {}, options }: ControlBarProps) {
  const { microphoneTrack, localParticipant } = useLocalParticipant();
  const [trackRef, setTrackRef] = useState<TrackReference | undefined>(
    undefined,
  );

  useEffect(() => {
    if (microphoneTrack) {
      setTrackRef({
        participant: localParticipant,
        publication: microphoneTrack,
        source: microphoneTrack.source,
      });
    } else {
      setTrackRef(undefined);
    }
  }, [microphoneTrack, localParticipant]);

  return (
    <View style={[style, styles.container]}>
      <TouchableOpacity
        style={[
          styles.button,
          options.isMicEnabled ? styles.enabledButton : undefined,
        ]}
        activeOpacity={0.7}
        onPress={() => options.onMicClick()}
      >
        {options.isMicEnabled ? (
          <Mic2 size={20} color='#FFFFFF' />
        ) : (
          <MicOff size={20} color='#FFFFFF' />
        )}
        <BarVisualizer
          barCount={3}
          trackRef={trackRef}
          style={styles.micVisualizer}
          options={{
            minHeight: 0.1,
            barColor: '#CCCCCC',
            barWidth: 2,
          }}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          options.isCameraEnabled ? styles.enabledButton : undefined,
        ]}
        activeOpacity={0.7}
        onPress={() => options.onCameraClick()}
      >
        {options.isCameraEnabled ? (
          <Camera size={20} color='#FFFFFF' />
        ) : (
          <CameraOff size={20} color='#FFFFFF' />
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          options.isScreenShareEnabled ? styles.enabledButton : undefined,
        ]}
        activeOpacity={0.7}
        onPress={() => options.onScreenShareClick()}
      >
        {options.isScreenShareEnabled ? (
          <ScreenShare size={20} color='#FFFFFF' />
        ) : (
          <ScreenShareOff size={20} color='#FFFFFF' />
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          options.isChatEnabled ? styles.enabledButton : undefined,
        ]}
        activeOpacity={0.7}
        onPress={() => options.onChatClick()}
      >
        {options.isChatEnabled ? (
          <MessageCircle size={20} color='#FFFFFF' />
        ) : (
          <MessageCircleOff size={20} color='#FFFFFF' opacity={0.5} />
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={() => options.onExitClick()}
      >
        <PhoneOff size={20} color='#FFFFFF' />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 8,
    backgroundColor: '#070707',
    borderColor: '#202020',
    borderRadius: 53,
    borderWidth: 1,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    padding: 10,
    marginHorizontal: 4,
    marginVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enabledButton: {
    backgroundColor: '#131313',
  },
  icon: {
    width: 20,
  },
  micVisualizer: {
    width: 20,
    height: 20,
  },
});
