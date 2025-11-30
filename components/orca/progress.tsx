import { useColor } from '@/hooks/useColor';
import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

interface SegmentedProgressProps {
  total: number; // Total number of segments
  correctSegments: number[]; // Array of segment indices that are correct
  failedSegments: number[]; // Array of segment indices that failed
  style?: ViewStyle;
  height?: number;
}

export function Progress({
  total,
  correctSegments = [],
  failedSegments = [],
  style,
  height = 16,
}: SegmentedProgressProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          gap: 4,
          width: '100%',
          height: height,
        },
        style,
      ]}
    >
      {Array.from({ length: total }).map((_, index) => (
        <SegmentBar
          key={index}
          isCorrect={correctSegments.includes(index)}
          isFailed={failedSegments.includes(index)}
          height={height}
        />
      ))}
    </View>
  );
}

interface SegmentBarProps {
  isCorrect: boolean;
  isFailed: boolean;
  height: number;
}

function SegmentBar({ isCorrect, isFailed, height }: SegmentBarProps) {
  const red = useColor('red');
  const green = useColor('green');
  const muted = useColor('muted');

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isCorrect || isFailed) {
      // Pop animation when segment changes state
      scale.value = withSequence(
        withTiming(1.2, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
      opacity.value = withSequence(
        withTiming(0.6, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
    }
  }, [isCorrect, isFailed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getBackgroundColor = () => {
    if (isCorrect) return green;
    if (isFailed) return red;
    return muted;
  };

  return (
    <Animated.View
      style={[
        {
          flex: 1,
          height: height,
          backgroundColor: getBackgroundColor(),
          borderRadius: height / 2,
        },
        animatedStyle,
      ]}
    />
  );
}
