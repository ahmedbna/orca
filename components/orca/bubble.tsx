import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { View } from '@/components/ui/view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { Canvas, Group, Circle } from '@shopify/react-native-skia';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 1. Skia Bubble Drawing Component
// Replicates the visual style of your original SVG Bubble using Skia primitives
const SkiaBubble = ({
  x,
  y,
  size,
  opacity,
}: {
  x: number;
  y: number;
  size: number;
  opacity: number;
}) => {
  const radius = size / 2;
  // Calculate highlight position (top-left offset like the original)
  const highlightX = x - radius * 0.3;
  const highlightY = y - radius * 0.3;
  const highlightRadius = radius * 0.25;

  return (
    <Group>
      {/* Main Bubble Body */}
      {/* Fill: slightly transparent white */}
      <Circle cx={x} cy={y} r={radius} opacity={opacity * 0.3} color='white' />

      {/* Stroke: solid white */}
      <Circle
        cx={x}
        cy={y}
        r={radius}
        style='stroke'
        // strokeWidth={2}
        opacity={opacity}
        color='white'
      />

      {/* Shine/Reflection Highlight */}
      <Circle
        cx={highlightX}
        cy={highlightY}
        r={highlightRadius}
        opacity={opacity}
        color='white'
      />
    </Group>
  );
};

// 2. Vertical Parallax Layer
const BubbleLayer = ({
  speed,
  count,
  scale,
  baseOpacity,
}: {
  speed: number;
  count: number;
  scale: number;
  baseOpacity: number;
}) => {
  const translateY = useSharedValue(0);

  // The loop height is the screen height plus a buffer to ensure smooth entry/exit
  const loopHeight = SCREEN_HEIGHT + 100;
  // Container must be tall enough to hold two vertical copies
  const containerHeight = loopHeight * 2;

  // Generate random positions
  const bubbles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      // Random X across the entire screen width
      x: Math.random() * SCREEN_WIDTH,
      // Random Y distributed along the loop height
      y: Math.random() * loopHeight,
      // Slight size variation
      randomSize: (Math.random() * 0.5 + 0.5) * 30 * scale,
    }));
  }, [count, loopHeight, scale]);

  useEffect(() => {
    // Duration is based on speed (higher speed = lower duration)
    const duration = (loopHeight / speed) * 1000;

    translateY.value = withRepeat(
      withTiming(-loopHeight, {
        duration: duration,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [speed, loopHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: SCREEN_WIDTH,
          height: containerHeight,
        },
        animatedStyle,
      ]}
    >
      <Canvas style={{ width: SCREEN_WIDTH, height: containerHeight }}>
        {/* Set 1: Initial position */}
        <Group>
          {bubbles.map((item) => (
            <SkiaBubble
              key={`b1-${item.id}`}
              x={item.x}
              y={item.y}
              size={item.randomSize}
              opacity={baseOpacity}
            />
          ))}
        </Group>

        {/* Set 2: Vertical Clone (shifted down by loopHeight) */}
        {/* This appears at the bottom as the first set scrolls up */}
        <Group origin={{ x: 0, y: loopHeight }}>
          {bubbles.map((item) => (
            <SkiaBubble
              key={`b2-${item.id}`}
              x={item.x}
              y={item.y + loopHeight}
              size={item.randomSize}
              opacity={baseOpacity}
            />
          ))}
        </Group>
      </Canvas>
    </Animated.View>
  );
};

// 3. Main Export
export const Bubbles = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents='none'>
      {/* Background Layer: Small, slow, faint */}
      <BubbleLayer speed={40} count={10} scale={0.6} baseOpacity={0.3} />

      {/* Middle Layer */}
      <BubbleLayer speed={50} count={8} scale={1} baseOpacity={0.5} />

      {/* Foreground Layer: Fast, larger */}
      <BubbleLayer speed={60} count={6} scale={1.2} baseOpacity={0.7} />
    </View>
  );
};
