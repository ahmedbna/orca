import React, { useMemo, useState, useEffect } from 'react';
import { View, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../ui/text';
import { ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TOTAL_DAYS = 7;
const SHADOW_HEIGHT = 6;
const HORIZONTAL_PADDING = 16; // Padding inside the card
const DAYS_GAP = 4; // Gap between day items

const STREAK_GRADIENT = [
  '#6C4CFF',
  '#B44CFF',
  '#FF2D87',
  '#FF4D4D',
  '#FF7A18',
  '#FFA200',
  '#FFD000',
] as const;

// Calculate day width based on screen width and spacing
const CONTAINER_PADDING = 32; // Padding from parent (adjust to match your layout)
const AVAILABLE_WIDTH =
  SCREEN_WIDTH - CONTAINER_PADDING * 2 - HORIZONTAL_PADDING * 2;
const TOTAL_GAP_WIDTH = DAYS_GAP * (TOTAL_DAYS - 1);
const DAY_WIDTH = (AVAILABLE_WIDTH - TOTAL_GAP_WIDTH) / TOTAL_DAYS;

export const Streak = () => {
  const [streak, setStreak] = useState(5);
  const pressed = useSharedValue(0);
  const pulse = useSharedValue(1);

  const animatedFaceStyle = useAnimatedStyle(() => {
    const translateY = interpolate(pressed.value, [0, 1], [0, SHADOW_HEIGHT]);
    return {
      transform: [{ translateY }, { scale: pulse.value }],
    };
  });

  const handlePressIn = () => {
    pressed.value = withSpring(1, { damping: 15 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 15 });
  };

  return (
    <Pressable style={styles.wrapper}>
      {/* Shadow */}
      <View style={styles.shadow} />

      {/* Face */}
      <Animated.View
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        style={[styles.face, animatedFaceStyle]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{streak} Day Streak</Text>

          <ChevronRight size={26} color='#aaa' />
        </View>

        {/* Gradient Streak Days */}
        <View style={styles.daysContainer}>
          {Array.from({ length: TOTAL_DAYS }).map((_, index) => (
            <StreakDay key={index} index={index} active={index < streak} />
          ))}
        </View>
      </Animated.View>
    </Pressable>
  );
};

interface StreakDayProps {
  index: number;
  active: boolean;
}

function StreakDay({ index, active }: StreakDayProps) {
  const gradientSlice = useMemo(
    () =>
      [
        STREAK_GRADIENT[index],
        STREAK_GRADIENT[Math.min(index + 1, STREAK_GRADIENT.length - 1)],
      ] as const,
    [index]
  );

  return (
    <View style={styles.dayContainer}>
      {active ? (
        <LinearGradient
          colors={gradientSlice}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.dayActive}
        >
          <Text style={styles.dayNumberActive}>{index + 1}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.dayInactive}>
          <Text style={styles.dayNumberInactive}>{index + 1}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: SHADOW_HEIGHT, // Space for shadow
  },
  shadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SHADOW_HEIGHT,
    bottom: 0,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    zIndex: 1,
  },
  face: {
    backgroundColor: '#000',
    borderRadius: 24,
    padding: HORIZONTAL_PADDING,
    gap: 8,
    zIndex: 2,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: DAYS_GAP,
  },
  dayContainer: {
    width: DAY_WIDTH,
    height: 32,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#444',
  },
  dayActive: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayInactive: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumberActive: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
  },
  dayNumberInactive: {
    color: '#777',
    fontWeight: '700',
    fontSize: 14,
  },
});
