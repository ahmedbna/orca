import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import { HEIGHT } from '@/theme/globals';
import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface ProgressProps {
  value: number; // 0-100
  style?: ViewStyle;
  height?: number;
  onValueChange?: (value: number) => void;
  onSeekStart?: () => void;
  onSeekEnd?: () => void;
  interactive?: boolean;
}

export function Progress({
  value,
  style,
  height = HEIGHT,
  onValueChange,
  onSeekStart,
  onSeekEnd,
  interactive = false,
}: ProgressProps) {
  const primaryColor = useColor('green');
  const mutedColor = useColor('muted');

  const clampedValue = Math.max(0, Math.min(100, value));
  const progressWidth = useSharedValue(clampedValue);
  const containerWidth = useSharedValue(200);
  const isDragging = useSharedValue(false);

  // Update animation when value changes
  useEffect(() => {
    if (!isDragging.value) {
      progressWidth.value = withTiming(clampedValue, { duration: 300 });
    }
  }, [clampedValue]);

  const updateValue = (newValue: number) => {
    const clamped = Math.max(0, Math.min(100, newValue));
    onValueChange?.(clamped);
  };

  const handleSeekStart = () => {
    isDragging.value = true;
    onSeekStart?.();
  };

  const handleSeekEnd = () => {
    isDragging.value = false;
    onSeekEnd?.();
  };

  // Pan Gesture
  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (!interactive) return;
      runOnJS(handleSeekStart)();
    })
    .onUpdate((event) => {
      if (!interactive) return;

      const newProgress = (event.x / containerWidth.value) * 100;
      const clampedProgress = Math.max(0, Math.min(100, newProgress));

      progressWidth.value = clampedProgress;
      runOnJS(updateValue)(clampedProgress);
    })
    .onEnd(() => {
      if (!interactive) return;
      runOnJS(handleSeekEnd)();
    });

  // Tap Gesture
  const tapGesture = Gesture.Tap().onStart((event) => {
    if (!interactive) return;

    runOnJS(handleSeekStart)();

    const newProgress = (event.x / containerWidth.value) * 100;
    const clampedProgress = Math.max(0, Math.min(100, newProgress));

    progressWidth.value = withTiming(clampedProgress, { duration: 200 });
    runOnJS(updateValue)(clampedProgress);

    setTimeout(() => {
      runOnJS(handleSeekEnd)();
    }, 200);
  });

  const combinedGesture = Gesture.Race(panGesture, tapGesture);

  // 🔥 FIXED: Use pixel width instead of '%'
  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: (progressWidth.value / 100) * containerWidth.value,
    };
  });

  const containerStyle: ViewStyle[] = [
    {
      height: height,
      width: '100%',
      backgroundColor: mutedColor,
      borderRadius: height / 2,
      overflow: 'hidden',
    },
    ...(style ? [style] : []),
  ];

  const onLayout = (event: any) => {
    containerWidth.value = event.nativeEvent.layout.width;
  };

  if (interactive) {
    return (
      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={containerStyle} onLayout={onLayout}>
          <Animated.View
            style={[
              {
                height: '100%',
                backgroundColor: primaryColor,
                borderRadius: height / 2,
              },
              animatedProgressStyle,
            ]}
          />
        </Animated.View>
      </GestureDetector>
    );
  }

  return (
    <View style={containerStyle} onLayout={onLayout}>
      <Animated.View
        style={[
          {
            height: '100%',
            backgroundColor: primaryColor,
            borderRadius: height / 2,
          },
          animatedProgressStyle,
        ]}
      />
    </View>
  );
}
