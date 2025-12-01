import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import {
  Canvas,
  Path,
  Skia,
  BlurMask,
  Group,
} from '@shopify/react-native-skia';
import { View } from '@/components/ui/view';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CartoonJellyfishProps {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
}

const CartoonJellyfish = ({
  x,
  y,
  size,
  color,
  opacity,
}: CartoonJellyfishProps) => {
  const bodyRadius = size * 0.4;
  const bodyY = y;

  const bodyPath = Skia.Path.Make();
  bodyPath.moveTo(x - bodyRadius, bodyY);
  bodyPath.cubicTo(
    x - bodyRadius,
    bodyY - bodyRadius * 1.2,
    x + bodyRadius,
    bodyY - bodyRadius * 1.2,
    x + bodyRadius,
    bodyY
  );
  bodyPath.cubicTo(
    x + bodyRadius * 0.6,
    bodyY + bodyRadius * 0.3,
    x + bodyRadius * 0.2,
    bodyY + bodyRadius * 0.15,
    x,
    bodyY + bodyRadius * 0.25
  );
  bodyPath.cubicTo(
    x - bodyRadius * 0.2,
    bodyY + bodyRadius * 0.15,
    x - bodyRadius * 0.6,
    bodyY + bodyRadius * 0.3,
    x - bodyRadius,
    bodyY
  );
  bodyPath.close();

  const tentacles = [];
  const tentacleCount = 5;
  for (let i = 0; i < tentacleCount; i++) {
    const tentaclePath = Skia.Path.Make();
    const startX = x - bodyRadius * 0.6 + i * bodyRadius * 0.3;
    const startY = bodyY + bodyRadius * 0.2;
    const length = size * 0.35 + Math.random() * size * 0.1;

    tentaclePath.moveTo(startX, startY);

    const segments = 3;
    for (let j = 0; j < segments; j++) {
      const segmentLength = length / segments;
      const endY = startY + (j + 1) * segmentLength;
      const midY = startY + (j + 0.5) * segmentLength;
      const curve = Math.sin(i * 0.8 + j) * size * 0.15;

      tentaclePath.quadTo(
        startX + curve,
        midY,
        startX + (j % 2 === 0 ? curve * 0.5 : -curve * 0.3),
        endY
      );
    }
    tentacles.push(tentaclePath);
  }

  return (
    <Group>
      {tentacles.map((tentacle, i) => (
        <Path
          key={`tentacle-${i}`}
          path={tentacle}
          color={color}
          style='stroke'
          strokeWidth={size * 0.08}
          opacity={opacity * 0.7}
          strokeCap='round'
        />
      ))}
      <Path path={bodyPath} color={color} opacity={opacity * 0.4}>
        <BlurMask blur={size * 0.15} style='normal' />
      </Path>
      <Path path={bodyPath} color={color} opacity={opacity * 0.6} />
    </Group>
  );
};

const ParallaxLayer = ({
  speed,
  count,
  scale,
  baseOpacity,
  yRange,
  color,
}: {
  speed: number;
  count: number;
  scale: number;
  baseOpacity: number;
  yRange: [number, number];
  color: string;
}) => {
  const translateX = useSharedValue(0);
  // The loop width must be wider than the screen to allow variance
  const loopWidth = SCREEN_WIDTH + 200;
  // IMPORTANT: The container width must accommodate BOTH copies
  const containerWidth = loopWidth * 2;

  // Generate random positions once
  const jellyfishItems = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * loopWidth,
      y: yRange[0] + Math.random() * (yRange[1] - yRange[0]),
    }));
  }, [count, loopWidth, yRange]);

  useEffect(() => {
    const duration = (loopWidth / speed) * 1000;

    translateX.value = withRepeat(
      withTiming(-loopWidth, {
        duration: duration,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [speed, loopWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          height: SCREEN_HEIGHT,
          width: containerWidth, // FIX: Explicit width ensures it doesn't move off-screen
        },
        animatedStyle,
      ]}
    >
      <Canvas style={{ width: containerWidth, height: SCREEN_HEIGHT }}>
        {/* First Group */}
        <Group>
          {jellyfishItems.map((item) => (
            <CartoonJellyfish
              key={`set1-${item.id}`}
              x={item.x}
              y={item.y}
              size={45 * scale}
              color={color}
              opacity={baseOpacity}
            />
          ))}
        </Group>

        {/* Second Group (Clone shifted by loopWidth) */}
        <Group origin={{ x: loopWidth, y: 0 }}>
          {jellyfishItems.map((item) => (
            <CartoonJellyfish
              key={`set2-${item.id}`}
              x={item.x + loopWidth}
              y={item.y}
              size={45 * scale}
              color={color}
              opacity={baseOpacity}
            />
          ))}
        </Group>
      </Canvas>
    </Animated.View>
  );
};

export const Jellyfish = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents='none'>
      <ParallaxLayer
        speed={30}
        count={6}
        scale={0.8}
        baseOpacity={0.45}
        yRange={[SCREEN_HEIGHT * 0.45, SCREEN_HEIGHT * 0.6]}
        color='rgba(0, 0, 40, 0.2)'
      />

      <ParallaxLayer
        speed={80}
        count={6}
        scale={1}
        baseOpacity={0.7}
        yRange={[SCREEN_HEIGHT * 0.8, SCREEN_HEIGHT * 0.9]}
        color='rgba(0, 0, 0, 0.1)'
      />
    </View>
  );
};
