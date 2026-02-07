import { useCallback, useEffect, useState } from 'react';
import { Animated, StyleSheet, useAnimatedValue, View } from 'react-native';
import {
  AudioSession,
  useIOSAudioManagement,
  useLocalParticipant,
  useParticipantTracks,
  useRoomContext,
} from '@livekit/react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Track } from 'livekit-client';
import { useSessionMessages, useTrackToggle } from '@livekit/components-react';
import { ChatLog } from '@/components/livekit/livekit-ui/ChatLog';
import { AgentVisualization } from '@/components/livekit/livekit-ui/AgentVisualization';
import { useConnection } from '@/components/livekit/useConnection';
import { OrcaButton } from '../squishy/orca-button';
import { Spinner } from '../ui/spinner';
import { Image } from 'expo-image';
import { Text } from '../ui/text';
import { Button } from '../ui/button';

export const Classroom = () => {
  useEffect(() => {
    let start = async () => {
      await AudioSession.startAudioSession();
    };

    start();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  return <RoomView />;
};

const RoomView = () => {
  const router = useRouter();
  const room = useRoomContext();
  const connection = useConnection();
  const insets = useSafeAreaInsets();

  useIOSAudioManagement(room, true);

  const {
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
    cameraTrack: localCameraTrack,
    localParticipant,
  } = useLocalParticipant();

  useEffect(() => {
    // If mic is off, turn it on immediately
    if (!isMicrophoneEnabled) {
      localParticipant.setMicrophoneEnabled(true);
    }
  }, [localParticipant, isMicrophoneEnabled]);

  // Messages
  const { messages, send } = useSessionMessages();
  const [isChatEnabled, setChatEnabled] = useState(true);
  // const [chatMessage, setChatMessage] = useState('');

  // const onChatSend = useCallback(
  //   (message: string) => {
  //     send(message);
  //     setChatMessage('');
  //   },
  //   [setChatMessage, send],
  // );

  // Control callbacks
  const micToggle = useTrackToggle({ source: Track.Source.Microphone });
  const onChatClick = useCallback(() => {
    setChatEnabled(!isChatEnabled);
  }, [isChatEnabled, setChatEnabled]);

  const onExitClick = useCallback(() => {
    connection.disconnect();
    router.back();
  }, [connection, router]);

  const agentVisualizationPosition = useAgentVisualizationPosition(
    isChatEnabled,
    isCameraEnabled || isScreenShareEnabled,
  );

  return messages.length === 0 ? (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FAD40B',
        paddingTop: 32,
        paddingBottom: 32,
        position: 'relative',
      }}
    >
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={{
            width: 200,
            height: 200,
          }}
          contentFit='cover'
        />
        <Spinner size='lg' variant='dots' color='#000' />

        <Text
          style={{
            color: '#000',
            fontWeight: 800,
            fontSize: 26,
            marginTop: 16,
          }}
        >
          Getting ready
        </Text>
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: 32,
          margin: 16,
          flexDirection: 'row',
          alignItems: 'stretch',
        }}
      >
        <OrcaButton variant='red' label='End Call' onPress={onExitClick} />
      </View>
    </View>
  ) : (
    <SafeAreaView style={{ backgroundColor: '#FAD40B' }}>
      <View style={styles.container}>
        <View style={styles.spacer} />
        <ChatLog style={styles.logContainer} messages={messages} />
        {/* <ChatBar
        style={styles.chatBar}
        value={chatMessage}
        onChangeText={(value) => {
          setChatMessage(value);
        }}
        onChatSend={onChatSend}
      /> */}

        {/* <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 16,
            paddingTop: insets.top + 4,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <Image
            source={require('@/assets/images/icon.png')}
            style={{ width: 100, height: 100 }}
            contentFit='contain'
          />
        </View> */}

        <Animated.View
          style={[
            {
              position: 'absolute',
              zIndex: 1,
              backgroundColor: '#000000',
              ...agentVisualizationPosition,
            },
          ]}
        >
          <AgentVisualization style={styles.agentVisualization} />
        </Animated.View>

        <View
          style={{
            margin: 16,
            flexDirection: 'row',
            alignItems: 'stretch',
          }}
        >
          <OrcaButton variant='red' label='End Call' onPress={onExitClick} />
        </View>

        {/* 
      <ControlBar
        style={styles.controlBar}
        options={{
          isMicEnabled: isMicrophoneEnabled,
          isCameraEnabled,
          isScreenShareEnabled,
          isChatEnabled,
          onMicClick: micToggle.toggle,
          onChatClick,
          onExitClick,
        }}
      /> */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    backgroundColor: '#FAD40B',
  },
  spacer: {
    height: '24%',
  },
  logContainer: {
    width: '100%',
    flexGrow: 1,
    flexDirection: 'column',
    marginBottom: 8,
  },
  chatBar: {
    left: 0,
    right: 0,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  controlBar: {
    left: 0,
    right: 0,
    zIndex: 2,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  agentVisualization: {
    width: '100%',
    height: '100%',
  },
});

const expandedAgentWidth = 1;
const expandedAgentHeight = 1;
const expandedLocalWidth = 0.3;
const expandedLocalHeight = 0.2;
const collapsedWidth = 0.3;
const collapsedHeight = 0.2;

const createAnimConfig = (toValue: any) => {
  return {
    toValue,
    stiffness: 200,
    damping: 30,
    useNativeDriver: false,
    isInteraction: false,
    overshootClamping: true,
  };
};

const useAgentVisualizationPosition = (
  isChatVisible: boolean,
  hasLocalVideo: boolean,
) => {
  const width = useAnimatedValue(
    isChatVisible ? collapsedWidth : expandedAgentWidth,
  );
  const height = useAnimatedValue(
    isChatVisible ? collapsedHeight : expandedAgentHeight,
  );

  useEffect(() => {
    const widthAnim = Animated.spring(
      width,
      createAnimConfig(isChatVisible ? collapsedWidth : expandedAgentWidth),
    );
    const heightAnim = Animated.spring(
      height,
      createAnimConfig(isChatVisible ? collapsedHeight : expandedAgentHeight),
    );

    widthAnim.start();
    heightAnim.start();

    return () => {
      widthAnim.stop();
      heightAnim.stop();
    };
  }, [width, height, isChatVisible]);

  const x = useAnimatedValue(0);
  const y = useAnimatedValue(0);
  useEffect(() => {
    let targetX: number;
    let targetY: number;

    if (!isChatVisible) {
      targetX = 0;
      targetY = 0;
    } else {
      if (!hasLocalVideo) {
        // Just agent visualizer showing in top section.
        targetX = 0.5 - collapsedWidth / 2;
        targetY = 16;
      } else {
        // Handle agent visualizer showing next to local video.
        targetX = 0.32 - collapsedWidth / 2;
        targetY = 16;
      }
    }

    const xAnim = Animated.spring(x, createAnimConfig(targetX));
    const yAnim = Animated.spring(y, createAnimConfig(targetY));

    xAnim.start();
    yAnim.start();

    return () => {
      xAnim.stop();
      yAnim.stop();
    };
  }, [x, y, isChatVisible, hasLocalVideo]);

  return {
    left: x.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    }),
    top: y, // y is defined in pixels
    width: width.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    }),
    height: height.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    }),
  };
};
