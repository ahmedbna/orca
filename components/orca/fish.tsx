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
  Circle,
} from '@shopify/react-native-skia';
import { View } from '@/components/ui/view';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CartoonFishProps {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
}

const CartoonFish = ({ x, y, size, color, opacity }: CartoonFishProps) => {
  // Fish facing Right
  const bodyPath = Skia.Path.Make();
  const r = size * 0.5; // Radius reference

  // 1. Draw Body (Teardrop shape pointing right)
  // Nose at (x + r), Tail connection at (x - r)
  bodyPath.moveTo(x - r * 0.8, y);
  // Top curve to nose
  bodyPath.cubicTo(
    x - r * 0.2,
    y - r * 0.8, // Control 1
    x + r * 0.4,
    y - r * 0.6, // Control 2
    x + r,
    y // Nose tip
  );
  // Bottom curve from nose
  bodyPath.cubicTo(
    x + r * 0.4,
    y + r * 0.6, // Control 1
    x - r * 0.2,
    y + r * 0.8, // Control 2
    x - r * 0.8,
    y // Back to tail connection
  );

  // 2. Draw Tail (Triangle pointing left)
  const tailPath = Skia.Path.Make();
  tailPath.moveTo(x - r * 0.7, y); // Center base of tail
  tailPath.lineTo(x - r * 1.4, y - r * 0.5); // Top tail tip
  tailPath.quadTo(
    x - r * 1.1,
    y, // Curve inward for tail style
    x - r * 1.4,
    y + r * 0.5 // Bottom tail tip
  );
  tailPath.close();

  // Combine Body and Tail
  bodyPath.addPath(tailPath);

  // 3. Side Fin (Small triangle/curve on body)
  const finPath = Skia.Path.Make();
  finPath.moveTo(x - r * 0.1, y + r * 0.1);
  finPath.quadTo(x - r * 0.4, y + r * 0.4, x + r * 0.1, y + r * 0.4);
  finPath.close();

  return (
    <Group opacity={opacity}>
      {/* Glow Effect */}
      <Path path={bodyPath} color={color} opacity={0.4}>
        <BlurMask blur={size * 0.2} style='normal' />
      </Path>

      {/* Main Body */}
      <Path path={bodyPath} color={color} style='fill' />

      {/* Detail: Side Fin */}
      <Path path={finPath} color={color} opacity={0.8} style='fill' />

      {/* Detail: Eye (White circle with dark pupil implied by contrast or minimal fill) */}
      <Circle
        cx={x + r * 0.5}
        cy={y - r * 0.15}
        r={size * 0.08}
        color='rgba(255,255,255,0.4)'
      />
    </Group>
  );
};

const FishParallaxLayer = ({
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

  // The loop width must be wider than the screen
  const loopWidth = SCREEN_WIDTH + 200;
  const containerWidth = loopWidth * 2;

  // Generate random positions
  const fishItems = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * loopWidth,
      y: yRange[0] + Math.random() * (yRange[1] - yRange[0]),
      // Add slight size variation
      randomScale: 0.8 + Math.random() * 0.4,
    }));
  }, [count, loopWidth, yRange]);

  useEffect(() => {
    const duration = (loopWidth / speed) * 1000;

    // ANIMATION CHANGE: Go from 0 to Positive LoopWidth (Left to Right)
    translateX.value = withRepeat(
      withTiming(loopWidth, {
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
          left: -loopWidth, // Offset canvas to the left so the "clone" is visible
          height: SCREEN_HEIGHT,
          width: containerWidth,
        },
        animatedStyle,
      ]}
    >
      <Canvas style={{ width: containerWidth, height: SCREEN_HEIGHT }}>
        {/* First Group (Main Set) */}
        <Group>
          {fishItems.map((item) => (
            <CartoonFish
              key={`fish-set1-${item.id}`}
              x={item.x}
              y={item.y}
              size={45 * scale * item.randomScale}
              color={color}
              opacity={baseOpacity}
            />
          ))}
        </Group>

        {/* Second Group (Clone shifted to the LEFT) 
            Since we move L->R, the clone trails behind or precedes 
            to fill the gap entering from the left. 
        */}
        <Group origin={{ x: -loopWidth, y: 0 }}>
          {fishItems.map((item) => (
            <CartoonFish
              key={`fish-set2-${item.id}`}
              x={item.x - loopWidth}
              y={item.y}
              size={45 * scale * item.randomScale}
              color={color}
              opacity={baseOpacity}
            />
          ))}
        </Group>
      </Canvas>
    </Animated.View>
  );
};

export const Fish = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents='none'>
      {/* Background Layer - Slower, smaller, darker */}
      <FishParallaxLayer
        speed={40} // Positive speed logic handling inside component
        count={5}
        scale={0.6}
        baseOpacity={0.3}
        yRange={[SCREEN_HEIGHT * 0.2, SCREEN_HEIGHT * 0.8]}
        color='rgba(0, 50, 80, 0.4)'
      />

      {/* Foreground Layer - Faster, larger */}
      <FishParallaxLayer
        speed={90}
        count={4}
        scale={1}
        baseOpacity={0.6}
        yRange={[SCREEN_HEIGHT * 0.3, SCREEN_HEIGHT * 0.7]}
        color='rgba(0, 20, 40, 0.3)'
      />
    </View>
  );
};
