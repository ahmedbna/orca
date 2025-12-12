import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  cancelAnimation,
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
}

const RealisticShark = ({
  x,
  y,
  size,
  color,
  opacity,
  direction,
}: RealisticSharkProps) => {
  // r serves as a relative unit for drawing
  const r = size * 0.8;
  const flip = direction === 'left' ? -1 : 1;

  // Peduncle height (thickness of tail base)
  const peduncleH = 0.13;

  // 1. STREAMLINED BODY
  const body = Skia.Path.Make();
  const noseX = x + flip * r * 2.2;
  const noseY = y;

  body.moveTo(noseX, noseY);

  // Top Profile
  body.cubicTo(
    x + flip * r * 1.5,
    y - r * 0.4,
    x + flip * r * 0.5,
    y - r * 0.55,
    x - flip * r * 0.5,
    y - r * 0.45
  );

  // Curve to tail
  body.cubicTo(
    x - flip * r * 1.2,
    y - r * 0.35,
    x - flip * r * 1.8,
    y - r * 0.15,
    x - flip * r * 2.0,
    y - r * peduncleH
  );

  // Tail Base Vertical
  body.lineTo(x - flip * r * 2.0, y + r * peduncleH);

  // Belly Profile
  body.cubicTo(
    x - flip * r * 1.0,
    y + r * 0.4,
    x + flip * r * 0.5,
    y + r * 0.55,
    x + flip * r * 1.0,
    y + r * 0.4
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

  // 2. AGGRESSIVE DORSAL FIN
  const dorsal = Skia.Path.Make();
  dorsal.moveTo(x + flip * r * 0.2, y - r * 0.5);
  dorsal.cubicTo(
    x + flip * r * 0.0,
    y - r * 0.9,
    x - flip * r * 0.3,
    y - r * 1.1,
    x - flip * r * 0.4,
    y - r * 0.9
  );
  dorsal.cubicTo(
    x - flip * r * 0.35,
    y - r * 0.7,
    x - flip * r * 0.3,
    y - r * 0.6,
    x - flip * r * 0.3,
    y - r * 0.45
  );
  dorsal.close();

  // 3. PECTORAL FIN - Adjusted to merge cleanly
  const pectoral = Skia.Path.Make();
  // Start slightly inside the body to ensure clean union
  pectoral.moveTo(x + flip * r * 0.6, y + r * 0.35);
  pectoral.cubicTo(
    x + flip * r * 0.3,
    y + r * 0.8,
    x - flip * r * 0.5,
    y + r * 1.0,
    x - flip * r * 0.2,
    y + r * 0.5
  );
  pectoral.close();

  // 4. TAIL - Adjusted overlap for Union
  const tail = Skia.Path.Make();
  // Move base slightly inward (1.95 instead of 2.0) to overlap body for union
  const tailBaseX = x - flip * r * 1.95;

  tail.moveTo(tailBaseX, y - r * peduncleH);
  tail.cubicTo(
    tailBaseX - flip * r * 0.5,
    y - r * 0.6,
    tailBaseX - flip * r * 0.8,
    y - r * 1.0,
    tailBaseX - flip * r * 1.1,
    y - r * 0.9
  );
  tail.lineTo(tailBaseX - flip * r * 0.5, y);
  tail.lineTo(tailBaseX - flip * r * 0.9, y + r * 0.6);
  tail.cubicTo(
    tailBaseX - flip * r * 0.6,
    y + r * 0.5,
    tailBaseX - flip * r * 0.3,
    y + r * 0.2,
    tailBaseX,
    y + r * peduncleH
  );
  tail.close();

  // 5. MERGE PATHS FOR CONTINUOUS BODY
  // We use Skia's PathOp to union the shapes. This removes internal geometry
  // and creates one single seamless silhouette.
  let silhouette = Skia.Path.MakeFromOp(body, tail, PathOp.Union);
  if (silhouette) {
    silhouette = Skia.Path.MakeFromOp(silhouette, dorsal, PathOp.Union);
  }
  if (silhouette) {
    silhouette = Skia.Path.MakeFromOp(silhouette, pectoral, PathOp.Union);
  }

  // Fallback if Op fails (rare)
  const finalShape = silhouette || body;

  // 6. GILL SLITS
  const gills = Skia.Path.Make();
  for (let i = 0; i < 3; i++) {
    const gx = x + flip * (r * 0.4 - i * r * 0.1);
    const gy = y + r * 0.05;
    gills.moveTo(gx, gy);
    gills.lineTo(gx - flip * r * 0.02, gy + r * 0.25);
  }

  // 7. EYE
  const eye = Skia.Path.Make();
  eye.addCircle(x + flip * r * 1.4, y - r * 0.1, size * 0.025);

  return (
    <Group opacity={opacity}>
      <Group>
        <BlurMask blur={size * 0.05} style='normal' />
        <Path path={finalShape} color={color} opacity={0.3} />
      </Group>

      {/* Main Continuous Body */}
      <Path path={finalShape} color={color} />

      {/* Details (Mouth, Gills, Eye) */}
      <Path
        path={Skia.Path.Make()
          .moveTo(x + flip * r * 1.8, y + r * 0.25)
          .lineTo(x + flip * r * 1.4, y + r * 0.2)
          .lineTo(x + flip * r * 1.6, y + r * 0.1)
          .close()}
        color='black'
        opacity={0.2}
      />
      <Path
        path={gills}
        color='black'
        style='stroke'
        strokeWidth={size * 0.02}
        opacity={0.3}
      />
      <Path path={eye} color='black' opacity={0.8} />
    </Group>
  );
};

const SharkParallaxLayer = (props: SharkLayerProps) => {
  const loopDistance = SCREEN_WIDTH;
  const startPos = props.direction === 'left' ? 0 : -loopDistance;
  const endPos = props.direction === 'left' ? -loopDistance : 0;

  const translateX = useSharedValue(startPos);

  const sharkItems = useMemo(() => {
    return Array.from({ length: props.count }).map((_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: props.yRange[0] + Math.random() * (props.yRange[1] - props.yRange[0]),
      randomScale: 0.8 + Math.random() * 0.4,
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

    return () => cancelAnimation(translateX);
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
      scale: 0.4,
      baseOpacity: 0.5,
      yRange: [SCREEN_HEIGHT * 0.3, SCREEN_HEIGHT * 0.6] as [number, number],
      color: 'rgba(0,0,0,0.2)',
    },
    {
      speed: 50,
      count: 2,
      scale: 0.3,
      baseOpacity: 0.4,
      yRange: [SCREEN_HEIGHT * 0.4, SCREEN_HEIGHT * 0.8] as [number, number],
      color: 'rgba(0,0,0,0.15)',
    },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents='none'>
      {(layers || defaultLayers).map((layer, i) => (
        <SharkParallaxLayer key={i} {...layer} direction={direction} />
      ))}
    </View>
  );
};
