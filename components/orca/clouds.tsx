import React, { useEffect, useMemo } from 'react';
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

// 🎨 Generate SpongeBob-style bubbly cloud shapes with smooth edges
const generateBubblePath = (size: number) => {
  const p = Skia.Path.Make();
  const r = size / 2;

  // Start at the leftmost point of the cloud
  p.moveTo(r * 0.1, r * 0.6);

  // Create a smooth, rounded blob using multiple cubic curves
  // Top-left curve (smoother transition)
  p.cubicTo(r * 0.05, r * 0.2, r * 0.3, r * 0.05, r * 0.7, r * 0.1);

  // Top-right curve
  p.cubicTo(r * 1.1, r * 0.15, r * 1.4, r * 0.4, r * 1.3, r * 0.7);

  // Bottom-right curve
  p.cubicTo(r * 1.25, r * 1.0, r * 0.9, r * 1.15, r * 0.5, r * 1.1);

  // Bottom-left curve (closes back to start smoothly)
  p.cubicTo(r * 0.2, r * 1.05, r * 0.15, r * 0.8, r * 0.1, r * 0.6);

  p.close();

  return p;
};

const generateCloudProps = () => {
  const size = random(40, 85); // small + medium underwater bubble clouds
  const startInside = Math.random() > 0.4;

  return {
    x: startInside
      ? random(0, SCREEN_WIDTH * 0.8)
      : SCREEN_WIDTH + random(0, SCREEN_WIDTH * 0.2),

    y: random(SCREEN_HEIGHT * 0.01, SCREEN_HEIGHT * 0.25),
    size,
    speed: random(0.25, 0.8),
    opacity: random(0.25, 0.75),
    tint: `rgba(255,255,255, ${random(0.4, 0.85)})`,
  };
};

const CloudElement = () => {
  const state = React.useRef(generateCloudProps()).current;
  const translateX = useSharedValue(state.x);

  const respawn = () => {
    const newCloud = generateCloudProps();

    state.x = newCloud.x;
    state.y = newCloud.y;
    state.size = newCloud.size;
    state.speed = newCloud.speed;
    state.opacity = newCloud.opacity;
    state.tint = newCloud.tint;

    translateX.value = newCloud.x;
    animate();
  };

  const animate = () => {
    const target = -state.size * 2;

    translateX.value = withTiming(
      target,
      {
        duration: 20000 / state.speed,
        easing: Easing.linear,
      },
      (finished) => finished && runOnJS(respawn)()
    );
  };

  useEffect(() => {
    animate();
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    top: state.y,
    width: state.size * 1.6,
    height: state.size,
    transform: [{ translateX: translateX.value }],
  }));

  // Pre-generate organic bubble path
  const path = useMemo(() => generateBubblePath(state.size), []);

  return (
    <Animated.View style={style}>
      <Canvas style={{ flex: 1 }}>
        <Group opacity={state.opacity}>
          <Path path={path} color={state.tint}>
            <BlurMask blur={8} style='normal' />
          </Path>

          {/* Secondary smaller highlight bubble */}
          <Path
            path={generateBubblePath(state.size * 0.45)}
            color={state.tint}
            style='fill'
            transform={[
              { translateX: state.size * 0.45 },
              { translateY: state.size * 0.15 },
            ]}
          >
            <BlurMask blur={5} style='normal' />
          </Path>
        </Group>
      </Canvas>
    </Animated.View>
  );
};

export const Clouds = ({ count = 18 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <CloudElement key={i} />
      ))}
    </>
  );
};
