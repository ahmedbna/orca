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
import {
  Canvas,
  Group,
  Path,
  Skia,
  BlurMask,
} from '@shopify/react-native-skia';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FishProps {
  layers?: Array<{
    speed?: number;
    count?: number;
    scale?: number;
    baseOpacity?: number;
    yRange?: [number, number];
    color?: string;
  }>;
  direction?: 'left' | 'right';
}

interface FishLayerProps {
  speed: number;
  count: number;
  scale: number;
  baseOpacity: number;
  yRange: [number, number];
  color: string;
  direction: 'left' | 'right';
}

interface CartoonFishProps {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  direction: 'left' | 'right';
}

const CartoonFish = ({
  x,
  y,
  size,
  color,
  opacity,
  direction,
}: CartoonFishProps) => {
  const bodyPath = Skia.Path.Make();
  const r = size * 0.5;
  const flip = direction === 'left' ? -1 : 1;

  bodyPath.moveTo(x + flip * (-r * 0.8), y);
  bodyPath.cubicTo(
    x + flip * (-r * 0.2),
    y - r * 0.8,
    x + flip * (r * 0.4),
    y - r * 0.6,
    x + flip * r,
    y
  );
  bodyPath.cubicTo(
    x + flip * (r * 0.4),
    y + r * 0.6,
    x + flip * (-r * 0.2),
    y + r * 0.8,
    x + flip * (-r * 0.8),
    y
  );

  const tailPath = Skia.Path.Make();
  tailPath.moveTo(x + flip * (-r * 0.7), y);
  tailPath.lineTo(x + flip * (-r * 1.4), y - r * 0.5);
  tailPath.quadTo(x + flip * (-r * 1.1), y, x + flip * (-r * 1.4), y + r * 0.5);
  tailPath.close();
  bodyPath.addPath(tailPath);

  const finPath = Skia.Path.Make();
  finPath.moveTo(x + flip * (-r * 0.1), y + r * 0.1);
  finPath.quadTo(
    x + flip * (-r * 0.4),
    y + r * 0.4,
    x + flip * (r * 0.1),
    y + r * 0.4
  );
  finPath.close();

  return (
    <Group opacity={opacity}>
      <Path path={bodyPath} color={color} opacity={0.4}>
        <BlurMask blur={size * 0.2} style='normal' />
      </Path>
      <Path path={bodyPath} color={color} style='fill' />
      <Path path={finPath} color={color} opacity={0.8} style='fill' />
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
  direction,
}: FishLayerProps) => {
  const translateX = useSharedValue(direction === 'right' ? 0 : SCREEN_WIDTH);
  const loopWidth = SCREEN_WIDTH + 200;
  const containerWidth = loopWidth * 2;

  const fishItems = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * loopWidth,
      y: yRange[0] + Math.random() * (yRange[1] - yRange[0]),
      randomScale: 0.8 + Math.random() * 0.4,
    }));
  }, [count, loopWidth, yRange]);

  useEffect(() => {
    const duration = (loopWidth / speed) * 1000;
    const target = direction === 'right' ? loopWidth : -loopWidth;

    translateX.value = withRepeat(
      withTiming(target, {
        duration: duration,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [speed, loopWidth, direction]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftOffset = direction === 'right' ? -loopWidth : 0;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: leftOffset,
          height: SCREEN_HEIGHT,
          width: containerWidth,
        },
        animatedStyle,
      ]}
    >
      <Canvas style={{ width: containerWidth, height: SCREEN_HEIGHT }}>
        <Group>
          {fishItems.map((item) => (
            <CartoonFish
              key={`fish-set1-${item.id}`}
              x={item.x}
              y={item.y}
              size={45 * scale * item.randomScale}
              color={color}
              opacity={baseOpacity}
              direction={direction}
            />
          ))}
        </Group>
        <Group
          origin={{ x: direction === 'right' ? -loopWidth : loopWidth, y: 0 }}
        >
          {fishItems.map((item) => (
            <CartoonFish
              key={`fish-set2-${item.id}`}
              x={item.x + (direction === 'right' ? -loopWidth : loopWidth)}
              y={item.y}
              size={45 * scale * item.randomScale}
              color={color}
              opacity={baseOpacity}
              direction={direction}
            />
          ))}
        </Group>
      </Canvas>
    </Animated.View>
  );
};

export const Fish = ({ layers, direction = 'right' }: FishProps = {}) => {
  const defaultLayers = [
    {
      speed: 20,
      count: 5,
      scale: 0.4,
      baseOpacity: 0.6,
      yRange: [SCREEN_HEIGHT * 0.2, SCREEN_HEIGHT * 0.8] as [number, number],
      color: 'rgba(0, 0, 0, 0.2)',
    },
    {
      speed: 50,
      count: 4,
      scale: 0.6,
      baseOpacity: 0.6,
      yRange: [SCREEN_HEIGHT * 0.3, SCREEN_HEIGHT * 0.7] as [number, number],
      color: 'rgba(0, 0, 0, 0.1)',
    },
  ];

  const finalLayers = layers || defaultLayers;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents='none'>
      {finalLayers.map((layer, idx) => (
        <FishParallaxLayer
          key={idx}
          speed={layer.speed || 30}
          count={layer.count || 5}
          scale={layer.scale || 0.5}
          baseOpacity={layer.baseOpacity || 0.6}
          yRange={layer.yRange || [SCREEN_HEIGHT * 0.3, SCREEN_HEIGHT * 0.7]}
          color={layer.color || 'rgba(0, 0, 0, 0.2)'}
          direction={direction}
        />
      ))}
    </View>
  );
};
