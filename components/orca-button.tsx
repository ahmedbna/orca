import React, { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  interpolate,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- THEME CONSTANTS ---
const COLORS = {
  background: '#FAD40B', // Orca Yellow
  locked: {
    face: '#E5E7EB',
    shadow: '#AFB2B7',
    text: '#AFB2B7',
  },
  active: {
    face: '#FFFFFF', // White face for active to make icon pop
    shadow: '#D1D5DB',
  },
  completed: {
    face: '#34C759',
    shadow: '#46A302',
    text: '#FFFFFF',
  },
  path: 'rgba(255, 255, 255, 0.4)',
};

const BUTTON_SHADOW_HEIGHT = 8;

export const OrcaButton = ({
  onPress,
  label,
  variant = 'yellow',
}: {
  onPress: () => void;
  label: string;
  variant?: 'yellow' | 'green';
}) => {
  const pressed = useSharedValue(0);
  const pulse = useSharedValue(1);

  const colors =
    variant === 'yellow'
      ? { face: COLORS.background, shadow: '#E5C000' }
      : COLORS.completed;

  const animatedFaceStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      pressed.value,
      [0, 1],
      [0, BUTTON_SHADOW_HEIGHT]
    );
    return {
      transform: [{ translateY }, { scale: pulse.value }],
    };
  });

  const handlePressIn = () => {
    pressed.value = withSpring(1, { damping: 15 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 15 });
    onPress();
  };

  return (
    <Animated.View style={{ height: 100 }}>
      {/* Shadow */}
      <View
        style={[
          styles.button3DShadow,
          {
            backgroundColor: colors.shadow,
            top: BUTTON_SHADOW_HEIGHT,
          },
        ]}
      />
      {/* Face */}
      <Animated.View
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        style={[
          styles.button3DFace,
          {
            backgroundColor: colors.face,
          },
          animatedFaceStyle,
        ]}
      >
        <Text
          variant='title'
          style={{
            color: variant === 'yellow' ? '#000' : '#FFF',
            fontSize: 18,
            fontWeight: '900',
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  oceanContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  button3DFace: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 64,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  button3DShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 64,
    borderRadius: 999,
    zIndex: 1,
  },
});
