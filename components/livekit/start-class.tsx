import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, Platform, Pressable } from 'react-native';
import { useConnection } from './useConnection';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/text';

const SHADOW_HEIGHT = 6;
const HORIZONTAL_PADDING = 16;

const RED = {
  face: '#FF3B30',
  shadow: '#C1271D',
  text: '#FFFFFF',
  border: 'rgba(0,0,0,0.15)',
};

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style);
  }
};

export const StartClass = () => {
  const router = useRouter();
  const pressed = useSharedValue(0);
  const pulse = useSharedValue(1);

  const animatedFaceStyle = useAnimatedStyle(() => {
    const translateY = interpolate(pressed.value, [0, 1], [0, SHADOW_HEIGHT]);
    return {
      transform: [{ translateY }, { scale: pulse.value }],
    };
  });
  const { isConnectionActive, connect } = useConnection();

  // Navigate to Assistant screen when we have the connection details.
  useEffect(() => {
    if (isConnectionActive) {
      router.push('/classroom/123'); // Navigate to the classroom screen with a sample ID
    }
  }, [isConnectionActive, router]);

  return (
    <Pressable
      onPress={() => connect()}
      onPressIn={() => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
        pressed.value = withSpring(1, { damping: 16 });
      }}
      onPressOut={() => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        pressed.value = withSpring(0, { damping: 16 });
      }}
      style={{
        flex: 1,
        paddingBottom: SHADOW_HEIGHT,
      }}
      disabled={isConnectionActive}
    >
      {/* Shadow */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: SHADOW_HEIGHT,
          bottom: 0,
          borderRadius: 24,
          backgroundColor: RED.shadow,
          zIndex: 1,
        }}
      />

      {/* Face */}
      <Animated.View
        style={[
          {
            backgroundColor: RED.face,
            borderRadius: 24,
            padding: HORIZONTAL_PADDING,
            gap: 12,
            zIndex: 2,
            borderWidth: 4,
            borderColor: RED.border,
            justifyContent: 'center',
          },
          animatedFaceStyle,
        ]}
      >
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text
            style={{
              fontSize: 24,
            }}
          >
            🧑‍🏫
          </Text>
          <Text
            style={{
              color: RED.text,
              fontSize: 20,
              fontWeight: '800',
            }}
          >
            CLASS
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};
