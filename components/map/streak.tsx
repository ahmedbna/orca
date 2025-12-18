import React, { useMemo, useState, useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
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

const TOTAL_DAYS = 7;
const SHADOW_HEIGHT = 6;

// const STREAK_GRADIENT = [
//   '#FFD000',
//   '#FFA200',
//   '#FF7A18',
//   '#FF4D4D',
//   '#FF2D87',
//   '#B44CFF',
//   '#6C4CFF',
// ] as const;

const STREAK_GRADIENT = [
  '#6C4CFF',
  '#B44CFF',
  '#FF2D87',
  '#FF4D4D',
  '#FF7A18',
  '#FFA200',
  '#FFD000',
] as const;

export const Streak = () => {
  const [streak, setStreak] = useState(5);
  const pressed = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.01, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

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
    <Animated.View style={styles.container}>
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
          <View style={styles.headerLeft}>
            <View>
              <Text style={styles.title}>{streak} Day Streak</Text>
              {/* <Text style={styles.subtitle}>
                Learn every day to keep it alive
              </Text> */}
            </View>
          </View>

          <ChevronRight size={32} color='#aaa' />
        </View>

        {/* Gradient Streak Days */}
        <View style={styles.daysContainer}>
          {Array.from({ length: TOTAL_DAYS }).map((_, index) => (
            <StreakDay key={index} index={index} active={index < streak} />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
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
  container: {
    height: 118,
    position: 'relative',
  },
  shadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SHADOW_HEIGHT,
    height: 110,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    zIndex: 1,
  },
  face: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 110,
    backgroundColor: '#000',
    borderRadius: 20,
    padding: 16,
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
    fontWeight: '900',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 14,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayContainer: {
    width: 42,
    height: 42,
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

export default Streak;
