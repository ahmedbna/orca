import React, { useMemo } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/text';
import { ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TOTAL_DAYS = 7;
const SHADOW_HEIGHT = 6;
const HORIZONTAL_PADDING = 16;
const DAYS_GAP = 4;

const STREAK_GRADIENT = [
  '#6C4CFF',
  '#B44CFF',
  '#FF2D87',
  '#FF4D4D',
  '#FF7A18',
  '#FFA200',
  '#FFD000',
] as const;

const CONTAINER_PADDING = 32;
const AVAILABLE_WIDTH =
  SCREEN_WIDTH - CONTAINER_PADDING * 2 - HORIZONTAL_PADDING * 2;
const TOTAL_GAP_WIDTH = DAYS_GAP * (TOTAL_DAYS - 1);
const DAY_WIDTH = (AVAILABLE_WIDTH - TOTAL_GAP_WIDTH) / TOTAL_DAYS;

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style);
  }
};

export const Streak = ({
  streak,
  onPress,
}: {
  streak: number;
  onPress?: () => void;
}) => {
  const startDayNumber = Math.max(1, streak - TOTAL_DAYS + 1);
  const pressed = useSharedValue(0);

  const animatedFaceStyle = useAnimatedStyle(() => {
    const translateY = interpolate(pressed.value, [0, 1], [0, SHADOW_HEIGHT]);
    return {
      transform: [{ translateY }],
    };
  });

  return (
    <Pressable
      style={styles.wrapper}
      onPress={onPress}
      onPressIn={() => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
        pressed.value = withSpring(1, { damping: 16 });
      }}
      onPressOut={() => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        pressed.value = withSpring(0, { damping: 16 });
      }}
    >
      {/* Shadow */}
      <View style={styles.shadow} />

      {/* Face */}
      <Animated.View style={[styles.face, animatedFaceStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {`${streak} ${streak === 1 ? 'Day' : 'Days'} Streak`}
          </Text>
          {onPress ? <ChevronRight size={26} color='#aaa' /> : null}
        </View>

        {/* Days */}
        <View style={styles.daysContainer}>
          {Array.from({ length: TOTAL_DAYS }).map((_, index) => {
            const dayNumber = startDayNumber + index;
            const active = dayNumber <= streak;
            return (
              <StreakDay
                key={index}
                index={index}
                active={active}
                label={dayNumber}
              />
            );
          })}
        </View>
      </Animated.View>
    </Pressable>
  );
};

interface StreakDayProps {
  index: number;
  active: boolean;
  label: number;
}

function StreakDay({ index, active, label }: StreakDayProps) {
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
          <Text style={styles.dayNumberActive}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.dayInactive}>
          <Text style={styles.dayNumberInactive}>{label}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: SHADOW_HEIGHT,
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
    gap: 12,
    zIndex: 2,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
