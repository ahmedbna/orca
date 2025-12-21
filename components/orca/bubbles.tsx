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

interface BubblesProps {
  layers?: Array<{
    speed?: number;
    count?: number;
    scale?: number;
    baseOpacity?: number;
    color?: string;
    yRange?: [number, number];
  }>;
  direction?: 'up' | 'down';
}

interface BubbleLayerProps {
  speed: number;
  count: number;
  scale: number;
  baseOpacity: number;
  color: string;
  direction: 'up' | 'down';
  yRange: [number, number];
}

const SkiaBubble = ({
  x,
  y,
  size,
  opacity,
  color,
}: {
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
}) => {
  const radius = size / 2;
  const highlightX = x - radius * 0.3;
  const highlightY = y - radius * 0.3;
  const highlightRadius = radius * 0.25;

  return (
    <Group>
      <Circle cx={x} cy={y} r={radius} opacity={opacity * 0.3} color={color} />
      <Circle
        cx={x}
        cy={y}
        r={radius}
        style='stroke'
        opacity={opacity}
        color={color}
      />
      <Circle
        cx={highlightX}
        cy={highlightY}
        r={highlightRadius}
        opacity={opacity}
        color={color}
      />
    </Group>
  );
};

const BubbleLayer = ({
  speed,
  count,
  scale,
  baseOpacity,
  color,
  direction,
  yRange,
}: BubbleLayerProps) => {
  const translateY = useSharedValue(0);
  const loopHeight = yRange[1] - yRange[0] + 100;
  const containerHeight = loopHeight * 2;

  const bubbles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: yRange[0] + Math.random() * (yRange[1] - yRange[0]),
      randomSize: (Math.random() * 0.5 + 0.5) * 30 * scale,
    }));
  }, [count, scale, yRange]);

  useEffect(() => {
    const duration = (loopHeight / speed) * 1000;
    const targetValue = direction === 'up' ? -loopHeight : loopHeight;

    translateY.value = withRepeat(
      withTiming(targetValue, {
        duration: duration,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [speed, loopHeight, direction]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: yRange[0],
          left: 0,
          width: SCREEN_WIDTH,
          height: containerHeight,
        },
        animatedStyle,
      ]}
    >
      <Canvas style={{ width: SCREEN_WIDTH, height: containerHeight }}>
        <Group>
          {bubbles.map((item) => (
            <SkiaBubble
              key={`b1-${item.id}`}
              x={item.x}
              y={item.y - yRange[0]}
              size={item.randomSize}
              opacity={baseOpacity}
              color={color}
            />
          ))}
        </Group>
        <Group>
          {bubbles.map((item) => (
            <SkiaBubble
              key={`b2-${item.id}`}
              x={item.x}
              y={item.y - yRange[0] + loopHeight}
              size={item.randomSize}
              opacity={baseOpacity}
              color={color}
            />
          ))}
        </Group>
      </Canvas>
    </Animated.View>
  );
};

export const Bubbles = ({ layers, direction = 'up' }: BubblesProps = {}) => {
  const defaultLayers = [
    // {
    //   speed: 40,
    //   count: 10,
    //   scale: 0.6,
    //   baseOpacity: 0.3,
    //   color: 'white',
    //   yRange: [0, SCREEN_HEIGHT] as [number, number],
    // },
    {
      speed: 50,
      count: 8,
      scale: 1,
      baseOpacity: 0.5,
      color: 'white',
      yRange: [0, SCREEN_HEIGHT] as [number, number],
    },
    {
      speed: 60,
      count: 6,
      scale: 1.2,
      baseOpacity: 0.7,
      color: 'white',
      yRange: [0, SCREEN_HEIGHT] as [number, number],
    },
  ];

  const finalLayers = layers || defaultLayers;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents='none'>
      {finalLayers.map((layer, idx) => (
        <BubbleLayer
          key={idx}
          speed={layer.speed || 50}
          count={layer.count || 8}
          scale={layer.scale || 1}
          baseOpacity={layer.baseOpacity || 0.5}
          color={layer.color || 'white'}
          direction={direction}
          yRange={layer.yRange || [0, SCREEN_HEIGHT]}
        />
      ))}
    </View>
  );
};
