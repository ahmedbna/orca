import React, { useEffect } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { LevelData } from './map';

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
    face: '#34C759', // Green
    // face: '#58CC02', //  Green
    shadow: '#46A302',
    text: '#FFFFFF',
  },
  path: 'rgba(255, 255, 255, 0.4)',
};

const NODE_SIZE = 86; // Slightly smaller to account for 3D depth
const BUTTON_HEIGHT = 80;
const BUTTON_SHADOW_HEIGHT = 10; // The 3D depth

export const SquishyButton = ({
  level,
  x,
  y,
  onPress,
}: {
  level: LevelData;
  x: number;
  y: number;
  onPress: (id: number) => void;
}) => {
  const isLocked = level.status === 'locked';
  const isActive = level.status === 'active';
  const isCompleted = level.status === 'completed';

  // Animation values
  const pressed = useSharedValue(0); // 0 = unpressed, 1 = pressed
  const bounce = useSharedValue(1); // For the active "breathing" effect

  // Define colors based on state
  const colors = isLocked
    ? COLORS.locked
    : isCompleted
      ? COLORS.completed
      : COLORS.active;

  useEffect(() => {
    if (isActive) {
      // Subtle breathing animation for current level
      bounce.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [isActive]);

  const animatedFaceStyle = useAnimatedStyle(() => {
    // Determine how much to move down based on press state
    const translateY = interpolate(
      pressed.value,
      [0, 1],
      [0, BUTTON_SHADOW_HEIGHT]
    );

    return {
      transform: [
        { translateY },
        { scale: isActive ? bounce.value : 1 }, // Apply breathing only if active
      ],
    };
  });

  const handlePressIn = () => {
    if (isLocked) return;
    pressed.value = withSpring(1, { damping: 15 });
  };

  const handlePressOut = () => {
    if (isLocked) return;
    pressed.value = withSpring(0, { damping: 15 });
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: x - NODE_SIZE / 2,
        top: y - BUTTON_HEIGHT / 2,
        width: NODE_SIZE,
        height: BUTTON_HEIGHT + BUTTON_SHADOW_HEIGHT,
        alignItems: 'center',
      }}
    >
      {/* Floating Label for Active Level */}
      {isActive && (
        <Animated.View
          style={[styles.floatingLabel, { transform: [{ translateY: -10 }] }]}
        >
          <Text style={styles.floatingLabelText}>START</Text>
          <View style={styles.triangle} />
        </Animated.View>
      )}

      {/* The Button Structure */}
      <Pressable
        onPress={() => !isLocked && onPress(level.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ width: '100%', height: '100%' }}
      >
        {/* SHADOW LAYER (The bottom part that stays still) */}
        <View
          style={[
            styles.buttonShadow,
            {
              backgroundColor: colors.shadow,
              top: BUTTON_SHADOW_HEIGHT, // Push it down
            },
          ]}
        />

        {/* FACE LAYER (The top part that moves) */}
        <Animated.View
          style={[
            styles.buttonFace,
            {
              backgroundColor: colors.face,
            },
            animatedFaceStyle,
          ]}
        >
          {isActive ? (
            <Image
              source={require('@/assets/images/icon.png')}
              style={{ width: 60, height: 60 }}
              contentFit='contain'
            />
          ) : isCompleted ? (
            // Checkmark for completed
            <Text variant='heading' style={{ color: '#FFF', fontSize: 32 }}>
              {level.order}
            </Text>
          ) : (
            // Number for locked
            <Text variant='heading' style={{ color: '#FFF', fontSize: 32 }}>
              {level.order}
            </Text>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  oceanContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sunRays: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.05)', // Subtle overlay
    zIndex: -1,
  },
  scrollView: {
    flex: 1,
  },
  buttonFace: {
    width: NODE_SIZE,
    height: BUTTON_HEIGHT,
    borderRadius: 999, // Squircle shape
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.05)', // Subtle inner rim
  },
  buttonShadow: {
    position: 'absolute',
    width: NODE_SIZE,
    height: BUTTON_HEIGHT,
    borderRadius: 999,
    zIndex: 1,
  },
  floatingLabel: {
    position: 'absolute',
    top: -40,
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    width: 100,
  },
  floatingLabelText: {
    color: COLORS.background,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
    textAlign: 'center',
  },
  triangle: {
    position: 'absolute',
    bottom: -8,
    left: 50,
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#000',
  },
});
