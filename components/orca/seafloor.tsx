import React, { useEffect, useMemo } from 'react';
import { Dimensions } from 'react-native';
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
  Circle,
  Skia,
  Path,
  LinearGradient,
  vec,
} from '@shopify/react-native-skia';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SeafloorProps {
  height?: number;
  speed?: number;
  sandColor?: [string, string];
  decorations?: {
    rocks: number;
    pebbles: number;
    coral: number;
  };
  direction?: 'left' | 'right';
}

const createSandPath = (width: number, startX: number, height: number) => {
  const path = Skia.Path.Make();
  const sandHeight = height * 0.5;
  const segments = 20;
  const segmentWidth = width / segments;

  path.moveTo(startX, height);
  path.lineTo(startX, sandHeight);

  for (let i = 0; i <= segments; i++) {
    const x = startX + i * segmentWidth;
    const randomness = Math.sin(i * 0.7) * 2 + Math.cos(i * 1.3) * 1.5;
    const y = sandHeight + randomness;

    if (i === 0) {
      path.lineTo(x, y);
    } else {
      const prevX = startX + (i - 1) * segmentWidth;
      const prevRandomness =
        Math.sin((i - 1) * 0.7) * 2 + Math.cos((i - 1) * 1.3) * 1.5;
      const prevY = sandHeight + prevRandomness;
      const cpX = (prevX + x) / 2;
      const cpY = (prevY + y) / 2;
      path.quadTo(cpX, cpY, x, y);
    }
  }

  path.lineTo(startX + width, height);
  path.close();
  return path;
};

const createRock = (x: number, y: number, size: number) => {
  const path = Skia.Path.Make();
  const sides = 5 + Math.floor(Math.random() * 3);

  for (let i = 0; i <= sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const radiusVariation = 0.7 + Math.random() * 0.6;
    const radius = size * radiusVariation;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;

    if (i === 0) {
      path.moveTo(px, py);
    } else {
      path.lineTo(px, py);
    }
  }
  path.close();
  return path;
};

const createCoral = (x: number, y: number, size: number) => {
  const path = Skia.Path.Make();
  const branches = 3 + Math.floor(Math.random() * 3);

  path.moveTo(x, y);

  for (let i = 0; i < branches; i++) {
    const angle = (i / branches) * Math.PI - Math.PI / 2;
    const length = size * (0.6 + Math.random() * 0.4);
    const endX = x + Math.cos(angle) * length;
    const endY = y - Math.abs(Math.sin(angle)) * length;

    path.moveTo(x, y);

    const cpX = x + Math.cos(angle) * length * 0.5 + (Math.random() - 0.5) * 5;
    const cpY = y - Math.abs(Math.sin(angle)) * length * 0.7;

    path.quadTo(cpX, cpY, endX, endY);
  }

  return path;
};

const generateDecorations = (
  segmentWidth: number,
  startX: number,
  height: number,
  counts: { rocks: number; pebbles: number; coral: number }
) => {
  const decorations: Array<{
    type: 'rock' | 'coral' | 'pebble';
    path?: any;
    x?: number;
    y?: number;
    size?: number;
    color: string;
  }> = [];

  const sandHeight = height * 0.5;

  for (let i = 0; i < counts.rocks; i++) {
    const x = startX + Math.random() * segmentWidth;
    const y = sandHeight + 8 + Math.random() * 25;
    const size = 4 + Math.random() * 6;
    const shade = 0.15 + Math.random() * 0.08;

    decorations.push({
      type: 'rock',
      path: createRock(x, y, size),
      color: `rgba(0, 0, 0, ${shade})`,
    });
  }

  for (let i = 0; i < counts.pebbles; i++) {
    const x = startX + Math.random() * segmentWidth;
    const y = sandHeight + 15 + Math.random() * 20;
    const size = 1.5 + Math.random() * 2;
    const shade = 0.12 + Math.random() * 0.06;

    decorations.push({
      type: 'pebble',
      x,
      y,
      size,
      color: `rgba(0, 0, 0, ${shade})`,
    });
  }

  for (let i = 0; i < counts.coral; i++) {
    const x =
      startX +
      (i + 1) * (segmentWidth / (counts.coral + 1)) +
      (Math.random() - 0.5) * 50;
    const y = sandHeight + 2;
    const size = 15 + Math.random() * 10;
    const shade = 0.14 + Math.random() * 0.04;

    decorations.push({
      type: 'coral',
      path: createCoral(x, y, size),
      color: `rgba(0, 0, 0, ${shade})`,
    });
  }

  return decorations;
};

export const Seafloor = ({
  height = 100,
  speed = 8000,
  sandColor = ['rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.12)'],
  decorations = { rocks: 8, pebbles: 15, coral: 4 },
  direction = 'left',
}: SeafloorProps = {}) => {
  const translateX = useSharedValue(
    direction === 'left' ? 0 : -SCREEN_WIDTH * 1.5
  );
  const loopWidth = SCREEN_WIDTH * 1.5;

  const segment1Decorations = useMemo(
    () => generateDecorations(loopWidth, 0, height, decorations),
    [
      loopWidth,
      height,
      decorations.rocks,
      decorations.pebbles,
      decorations.coral,
    ]
  );
  const segment2Decorations = useMemo(
    () => generateDecorations(loopWidth, loopWidth, height, decorations),
    [
      loopWidth,
      height,
      decorations.rocks,
      decorations.pebbles,
      decorations.coral,
    ]
  );

  useEffect(() => {
    const target = direction === 'left' ? -loopWidth : loopWidth;
    translateX.value = withRepeat(
      withTiming(target, {
        duration: speed,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [loopWidth, speed, direction]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const sandPath1 = useMemo(
    () => createSandPath(loopWidth, 0, height),
    [loopWidth, height]
  );
  const sandPath2 = useMemo(
    () => createSandPath(loopWidth, loopWidth, height),
    [loopWidth, height]
  );

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: height,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: loopWidth * 2,
            height: height,
          },
          animatedStyle,
        ]}
      >
        <Canvas style={{ width: loopWidth * 2, height: height }}>
          <Path path={sandPath1}>
            <LinearGradient
              start={vec(0, height * 0.5)}
              end={vec(0, height)}
              colors={sandColor}
            />
          </Path>

          <Group>
            {segment1Decorations.map((deco, i) => {
              if (deco.type === 'pebble') {
                return (
                  <Circle
                    key={`deco1-${i}`}
                    cx={deco.x!}
                    cy={deco.y!}
                    r={deco.size!}
                    color={deco.color}
                  />
                );
              } else {
                return (
                  <Path
                    key={`deco1-${i}`}
                    path={deco.path}
                    color={deco.color}
                    style={deco.type === 'coral' ? 'stroke' : 'fill'}
                    strokeWidth={deco.type === 'coral' ? 2 : undefined}
                    strokeCap={deco.type === 'coral' ? 'round' : undefined}
                  />
                );
              }
            })}
          </Group>

          <Path path={sandPath2}>
            <LinearGradient
              start={vec(loopWidth, height * 0.5)}
              end={vec(loopWidth, height)}
              colors={sandColor}
            />
          </Path>

          <Group>
            {segment2Decorations.map((deco, i) => {
              if (deco.type === 'pebble') {
                return (
                  <Circle
                    key={`deco2-${i}`}
                    cx={deco.x!}
                    cy={deco.y!}
                    r={deco.size!}
                    color={deco.color}
                  />
                );
              } else {
                return (
                  <Path
                    key={`deco2-${i}`}
                    path={deco.path}
                    color={deco.color}
                    style={deco.type === 'coral' ? 'stroke' : 'fill'}
                    strokeWidth={deco.type === 'coral' ? 2 : undefined}
                    strokeCap={deco.type === 'coral' ? 'round' : undefined}
                  />
                );
              }
            })}
          </Group>
        </Canvas>
      </Animated.View>
    </View>
  );
};
