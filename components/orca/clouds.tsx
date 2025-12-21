import React, { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {
  Canvas,
  Group,
  Path,
  Skia,
  BlurMask,
} from '@shopify/react-native-skia';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const random = (min: number, max: number) => Math.random() * (max - min) + min;

/* ---------------- Bubble path ---------------- */

const generateBubblePath = (size: number) => {
  const p = Skia.Path.Make();
  const r = size / 2;

  p.moveTo(r * 0.1, r * 0.6);
  p.cubicTo(r * 0.05, r * 0.2, r * 0.3, r * 0.05, r * 0.7, r * 0.1);
  p.cubicTo(r * 1.1, r * 0.15, r * 1.4, r * 0.4, r * 1.3, r * 0.7);
  p.cubicTo(r * 1.25, r * 1.0, r * 0.9, r * 1.15, r * 0.5, r * 1.1);
  p.cubicTo(r * 0.2, r * 1.05, r * 0.15, r * 0.8, r * 0.1, r * 0.6);
  p.close();

  return p;
};

/* ---------------- Cloud props ---------------- */

const generateCloudProps = () => {
  const size = random(40, 85);
  const startInside = Math.random() > 0.4;

  return {
    x: startInside
      ? random(0, SCREEN_WIDTH * 0.8)
      : SCREEN_WIDTH + random(0, SCREEN_WIDTH * 0.2),
    y: random(SCREEN_HEIGHT * 0.01, SCREEN_HEIGHT * 0.12),
    size,
    speed: random(0.25, 0.8),
    opacity: random(0.25, 0.75),
    tint: `rgba(255,255,255, ${random(0.4, 0.85)})`,
  };
};

/* ---------------- Cloud ---------------- */

const CloudElement = () => {
  /** Animated value (position only) */
  const translateX = useSharedValue(0);

  /** Visual state (forces render) */
  const [cloud, setCloud] = useState(() => generateCloudProps());

  /** Skia paths depend on size */
  const mainPath = React.useMemo(
    () => generateBubblePath(cloud.size),
    [cloud.size]
  );

  const highlightPath = React.useMemo(
    () => generateBubblePath(cloud.size * 0.45),
    [cloud.size]
  );

  const respawn = () => {
    const next = generateCloudProps();
    setCloud(next);
    translateX.value = next.x;
    animate(next);
  };

  const animate = (c = cloud) => {
    translateX.value = withTiming(
      -c.size * 2,
      {
        duration: 20000 / c.speed,
        easing: Easing.linear,
      },
      (finished) => finished && runOnJS(respawn)()
    );
  };

  useEffect(() => {
    translateX.value = cloud.x;
    animate(cloud);
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    top: cloud.y,
    width: cloud.size * 1.6,
    height: cloud.size,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={style}>
      <Canvas style={{ width: '100%', height: '100%' }}>
        <Group opacity={cloud.opacity}>
          <Path path={mainPath} color={cloud.tint}>
            <BlurMask blur={8} style='normal' />
          </Path>

          <Path
            path={highlightPath}
            color={cloud.tint}
            transform={[
              { translateX: cloud.size * 0.45 },
              { translateY: cloud.size * 0.15 },
            ]}
          >
            <BlurMask blur={5} style='normal' />
          </Path>
        </Group>
      </Canvas>
    </Animated.View>
  );
};

/* ---------------- Cloud field ---------------- */

export const Clouds = ({ count = 12 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <CloudElement key={i} />
      ))}
    </>
  );
};
