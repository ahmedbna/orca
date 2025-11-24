import { useEffect, useMemo } from 'react';
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
  LinearGradient,
  vec,
  Group,
  Circle,
} from '@shopify/react-native-skia';
import { View } from '@/components/ui/view';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Create sand texture with organic wavy top edge
const createSandPath = (width: number, startX: number) => {
  const path = Skia.Path.Make();
  const sandHeight = 50;
  const segments = 20;
  const segmentWidth = width / segments;

  path.moveTo(startX, 100); // Changed from SCREEN_HEIGHT to relative
  path.lineTo(startX, 50); // Changed from SCREEN_HEIGHT - sandHeight

  // Create organic wavy top edge
  for (let i = 0; i <= segments; i++) {
    const x = startX + i * segmentWidth;
    const randomness = Math.sin(i * 0.7) * 2 + Math.cos(i * 1.3) * 1.5;
    const y = 50 + randomness; // Changed to relative

    if (i === 0) {
      path.lineTo(x, y);
    } else {
      const prevX = startX + (i - 1) * segmentWidth;
      const prevRandomness =
        Math.sin((i - 1) * 0.7) * 2 + Math.cos((i - 1) * 1.3) * 1.5;
      const prevY = 50 + prevRandomness;

      const cpX = (prevX + x) / 2;
      const cpY = (prevY + y) / 2;
      path.quadTo(cpX, cpY, x, y);
    }
  }

  path.lineTo(startX + width, 100);
  path.close();

  return path;
};

// Create irregular rock shapes
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

// Create coral-like structure
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

// Generate static decorations for one segment
const generateDecorations = (segmentWidth: number, startX: number) => {
  const decorations: Array<{
    type: 'rock' | 'coral' | 'pebble';
    path?: any;
    x?: number;
    y?: number;
    size?: number;
    color: string;
  }> = [];

  // Rocks
  const rockCount = 8;
  for (let i = 0; i < rockCount; i++) {
    const x = startX + Math.random() * segmentWidth;
    const y = 58 + Math.random() * 25; // Changed to relative
    const size = 4 + Math.random() * 6;
    const shade = 0.15 + Math.random() * 0.08;

    decorations.push({
      type: 'rock',
      path: createRock(x, y, size),
      color: `rgba(0, 0, 0, ${shade})`,
    });
  }

  // Small pebbles
  const pebbleCount = 15;
  for (let i = 0; i < pebbleCount; i++) {
    const x = startX + Math.random() * segmentWidth;
    const y = 65 + Math.random() * 20; // Changed to relative
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

  // Coral structures
  const coralCount = 4;
  for (let i = 0; i < coralCount; i++) {
    const x =
      startX +
      (i + 1) * (segmentWidth / (coralCount + 1)) +
      (Math.random() - 0.5) * 50;
    const y = 52; // Changed to relative
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

export const Seafloor = () => {
  const translateX = useSharedValue(0);

  // Seamless loop width
  const loopWidth = SCREEN_WIDTH * 1.5;

  // Generate decorations once for both segments
  const segment1Decorations = useMemo(
    () => generateDecorations(loopWidth, 0),
    [loopWidth]
  );
  const segment2Decorations = useMemo(
    () => generateDecorations(loopWidth, loopWidth),
    [loopWidth]
  );

  useEffect(() => {
    // Smooth continuous scroll - slowest layer for parallax depth
    translateX.value = withRepeat(
      withTiming(-loopWidth, {
        duration: 8000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [loopWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Create sand paths for both segments
  const sandPath1 = useMemo(() => createSandPath(loopWidth, 0), [loopWidth]);
  const sandPath2 = useMemo(
    () => createSandPath(loopWidth, loopWidth),
    [loopWidth]
  );

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
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
            height: 100,
          },
          animatedStyle,
        ]}
      >
        <Canvas style={{ width: loopWidth * 2, height: 100 }}>
          {/* First segment - sand base with gradient */}
          <Path path={sandPath1}>
            <LinearGradient
              start={vec(0, 50)}
              end={vec(0, 100)}
              colors={['rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.12)']}
            />
          </Path>

          {/* First segment - decorations */}
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

          {/* Second segment - sand base with gradient */}
          <Path path={sandPath2}>
            <LinearGradient
              start={vec(loopWidth, 50)}
              end={vec(loopWidth, 100)}
              colors={['rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.12)']}
            />
          </Path>

          {/* Second segment - decorations */}
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
