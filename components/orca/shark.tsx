import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  cancelAnimation,
  useDerivedValue,
  SharedValue,
} from 'react-native-reanimated';
import {
  Canvas,
  Group,
  Path,
  Skia,
  BlurMask,
  PathOp,
} from '@shopify/react-native-skia';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SharkProps {
  layers?: Array<{
    speed: number;
    count: number;
    scale: number;
    baseOpacity: number;
    yRange: [number, number];
    color: string;
  }>;
  direction?: 'left' | 'right';
}

interface SharkLayerProps {
  speed: number;
  count: number;
  scale: number;
  baseOpacity: number;
  yRange: [number, number];
  color: string;
  direction: 'left' | 'right';
}

interface RealisticSharkProps {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  direction: 'left' | 'right';
  swimProgress: SharedValue<number>;
  offset: number;
}

const RealisticShark = ({
  x,
  y,
  size,
  color,
  opacity,
  direction,
  swimProgress,
  offset,
}: RealisticSharkProps) => {
  const r = size * 0.8;
  const flip = direction === 'left' ? -1 : 1;

  // 1. Calculate the Main Body Silhouette on the UI Thread
  const silhouettePath = useDerivedValue(() => {
    const currentProgress = (swimProgress.value + offset) % 1;

    // --- ADJUSTMENTS HERE ---
    // Reduced tailSwing from 0.35 to 0.15 for less rotation
    const tailSwing = Math.sin(currentProgress * Math.PI * 2) * r * 0.15;

    // Reduced bodyWave from 0.1 to 0.05 so the head doesn't wobble too much
    const bodyWave = Math.sin(currentProgress * Math.PI * 2 - 0.5) * r * 0.05;

    const pectoralWave =
      Math.sin(currentProgress * Math.PI * 2 + Math.PI) * r * 0.1;

    const peduncleH = 0.13;
    const noseX = x + flip * r * 2.2;
    const noseY = y;

    // --- BODY PATH ---
    const body = Skia.Path.Make();
    body.moveTo(noseX, noseY);

    // Top Profile
    body.cubicTo(
      x + flip * r * 1.5,
      y - r * 0.4 + bodyWave * 0.2,
      x + flip * r * 0.5,
      y - r * 0.55 + bodyWave * 0.4,
      x - flip * r * 0.5,
      y - r * 0.45 + bodyWave * 0.6
    );

    // Curve to tail
    body.cubicTo(
      x - flip * r * 1.2,
      y - r * 0.35 + bodyWave * 0.8,
      x - flip * r * 1.8,
      y - r * 0.15 + tailSwing * 0.3,
      x - flip * r * 2.0,
      y - r * peduncleH + tailSwing * 0.5
    );

    // Tail Base Vertical
    body.lineTo(x - flip * r * 2.0, y + r * peduncleH + tailSwing * 0.5);

    // Belly Profile
    body.cubicTo(
      x - flip * r * 1.0,
      y + r * 0.4 + bodyWave * 0.8,
      x + flip * r * 0.5,
      y + r * 0.55 + bodyWave * 0.4,
      x + flip * r * 1.0,
      y + r * 0.4 + bodyWave * 0.2
    );

    // Lower Jaw
    body.lineTo(x + flip * r * 1.8, y + r * 0.25);

    // Mouth
    body.cubicTo(
      x + flip * r * 1.4,
      y + r * 0.2,
      x + flip * r * 1.6,
      y + r * 0.1,
      noseX - flip * r * 0.1,
      noseY + r * 0.05
    );
    body.close();

    // --- DORSAL FIN ---
    const dorsal = Skia.Path.Make();
    dorsal.moveTo(x + flip * r * 0.2, y - r * 0.5 + bodyWave * 0.4);
    dorsal.cubicTo(
      x + flip * r * 0.0,
      y - r * 0.9 + bodyWave * 0.3,
      x - flip * r * 0.3,
      y - r * 1.1 + bodyWave * 0.5,
      x - flip * r * 0.4,
      y - r * 0.9 + bodyWave * 0.6
    );
    dorsal.cubicTo(
      x - flip * r * 0.35,
      y - r * 0.7 + bodyWave * 0.6,
      x - flip * r * 0.3,
      y - r * 0.6 + bodyWave * 0.5,
      x - flip * r * 0.3,
      y - r * 0.45 + bodyWave * 0.5
    );
    dorsal.close();

    // --- PECTORAL FIN ---
    const pectoral = Skia.Path.Make();
    pectoral.moveTo(x + flip * r * 0.6, y + r * 0.35 + bodyWave * 0.3);
    pectoral.cubicTo(
      x + flip * r * 0.3,
      y + r * 0.8 + pectoralWave,
      x - flip * r * 0.5,
      y + r * 1.0 + pectoralWave,
      x - flip * r * 0.2,
      y + r * 0.5 + bodyWave * 0.5
    );
    pectoral.close();

    // --- TAIL ---
    const tail = Skia.Path.Make();
    const tailBaseX = x - flip * r * 1.95;
    const tailBaseY = y + tailSwing * 0.5;

    tail.moveTo(tailBaseX, tailBaseY - r * peduncleH);
    // Reduced the multiplier on tailSwing here specifically to reduce the tip rotation
    tail.cubicTo(
      tailBaseX - flip * r * 0.5,
      y - r * 0.6 + tailSwing,
      tailBaseX - flip * r * 0.8,
      y - r * 1.0 + tailSwing * 1.2,
      tailBaseX - flip * r * 1.1,
      y - r * 0.9 + tailSwing * 1.4
    );
    tail.lineTo(tailBaseX - flip * r * 0.5, tailBaseY);
    tail.lineTo(tailBaseX - flip * r * 0.9, y + r * 0.6 - tailSwing * 1.4);
    tail.cubicTo(
      tailBaseX - flip * r * 0.6,
      y + r * 0.5 - tailSwing * 1.2,
      tailBaseX - flip * r * 0.3,
      y + r * 0.2 - tailSwing,
      tailBaseX,
      tailBaseY + r * peduncleH
    );
    tail.close();

    let result = Skia.Path.MakeFromOp(body, tail, PathOp.Union);
    if (result) result = Skia.Path.MakeFromOp(result, dorsal, PathOp.Union);
    if (result) result = Skia.Path.MakeFromOp(result, pectoral, PathOp.Union);

    return result || body;
  }, [swimProgress, x, y, size, direction, offset]);

  const detailsPath = useDerivedValue(() => {
    const currentProgress = (swimProgress.value + offset) % 1;
    // Matched reduced bodyWave here
    const bodyWave = Math.sin(currentProgress * Math.PI * 2 - 0.5) * r * 0.05;

    const p = Skia.Path.Make();

    // Mouth
    p.moveTo(x + flip * r * 1.8, y + r * 0.25);
    p.lineTo(x + flip * r * 1.4, y + r * 0.2);
    p.lineTo(x + flip * r * 1.6, y + r * 0.1);

    // Gills
    for (let i = 0; i < 3; i++) {
      const gx = x + flip * (r * 0.4 - i * r * 0.1);
      const gy = y + r * 0.05 + bodyWave * 0.3;
      p.moveTo(gx, gy);
      p.lineTo(gx - flip * r * 0.02, gy + r * 0.25);
    }

    return p;
  }, [swimProgress, x, y, size, direction, offset]);

  // Separate Eye for Fill
  const eyePath = useDerivedValue(() => {
    const currentProgress = (swimProgress.value + offset) % 1;
    const bodyWave = Math.sin(currentProgress * Math.PI * 2 - 0.5) * r * 0.05;
    const p = Skia.Path.Make();
    p.addCircle(x + flip * r * 1.4, y - r * 0.1 + bodyWave * 0.2, size * 0.025);
    return p;
  }, [swimProgress, x, y, size, direction, offset]);

  return (
    <Group opacity={opacity}>
      <Group>
        <BlurMask blur={size * 0.05} style='normal' />
        <Path path={silhouettePath} color={color} opacity={0.3} />
      </Group>

      <Path path={silhouettePath} color={color} />

      <Path
        path={detailsPath}
        color='black'
        style='stroke'
        strokeWidth={size * 0.02}
        opacity={0.3}
      />
      <Path path={eyePath} color='black' opacity={0.6} />
    </Group>
  );
};

const SharkParallaxLayer = (props: SharkLayerProps) => {
  const loopDistance = SCREEN_WIDTH;
  const startPos = props.direction === 'left' ? 0 : -loopDistance;
  const endPos = props.direction === 'left' ? -loopDistance : 0;

  const translateX = useSharedValue(startPos);
  const swimAnimation = useSharedValue(0);

  const sharkItems = useMemo(() => {
    return Array.from({ length: props.count }).map((_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: props.yRange[0] + Math.random() * (props.yRange[1] - props.yRange[0]),
      randomScale: 0.8 + Math.random() * 0.4,
      swimOffset: Math.random(),
    }));
  }, [props.count, props.yRange]);

  useEffect(() => {
    translateX.value = startPos;
    const duration = (loopDistance / props.speed) * 1000;

    translateX.value = withRepeat(
      withTiming(endPos, { duration, easing: Easing.linear }),
      -1,
      false
    );

    // --- ADJUSTMENT HERE ---
    // Increased duration from 1500 to 3000 for a slower, calmer swim
    swimAnimation.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    return () => {
      cancelAnimation(translateX);
      cancelAnimation(swimAnimation);
    };
  }, [props.speed, props.direction, loopDistance]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          width: SCREEN_WIDTH * 2,
          height: SCREEN_HEIGHT,
        },
        animatedStyle,
      ]}
    >
      <Canvas style={{ flex: 1 }}>
        {[0, SCREEN_WIDTH].map((offset) => (
          <Group key={offset}>
            {sharkItems.map((item) => (
              <RealisticShark
                key={`${offset}-${item.id}`}
                x={item.x + offset}
                y={item.y}
                size={55 * props.scale * item.randomScale}
                color={props.color}
                opacity={props.baseOpacity}
                direction={props.direction}
                swimProgress={swimAnimation}
                offset={item.swimOffset}
              />
            ))}
          </Group>
        ))}
      </Canvas>
    </Animated.View>
  );
};

export const Shark = ({ layers, direction = 'right' }: SharkProps = {}) => {
  const defaultLayers = [
    {
      speed: 25,
      count: 3,
      scale: 0.3,
      baseOpacity: 0.4,
      yRange: [SCREEN_HEIGHT * 0.1, SCREEN_HEIGHT * 0.3] as [number, number],
      color: 'rgba(0,0,0,0.2)',
    },
    // {
    //   speed: 50,
    //   count: 2,
    //   scale: 0.2,
    //   baseOpacity: 0.3,
    //   yRange: [SCREEN_HEIGHT * 0.35, SCREEN_HEIGHT * 0.8] as [number, number],
    //   color: 'rgba(0,0,0,0.15)',
    // },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents='none'>
      {(layers || defaultLayers).map((layer, i) => (
        <SharkParallaxLayer key={i} {...layer} direction={direction} />
      ))}
    </View>
  );
};
