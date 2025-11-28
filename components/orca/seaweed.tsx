import { useEffect, useMemo } from 'react';
import { Dimensions } from 'react-native';
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
} from '@shopify/react-native-skia';
import { View } from '@/components/ui/view';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Create a realistic seaweed strand path
const createSeaweedPath = (
  baseX: number,
  height: number,
  segments: number = 8
) => {
  const path = Skia.Path.Make();
  const segmentHeight = height / segments;
  const baseWidth = 8;
  const baseY = 120; // Base at bottom of canvas

  path.moveTo(baseX, baseY);

  for (let i = 0; i <= segments; i++) {
    const y = baseY - i * segmentHeight;
    const curve = Math.sin(i * 0.6) * (12 - i * 1.2);
    const width = baseWidth * (1 - (i / segments) * 0.6);

    if (i === 0) {
      path.lineTo(baseX + width / 2, y);
    } else {
      const prevY = baseY - (i - 1) * segmentHeight;
      const prevCurve = Math.sin((i - 1) * 0.6) * (12 - (i - 1) * 1.2);

      path.quadTo(
        baseX + prevCurve + width / 2,
        (prevY + y) / 2,
        baseX + curve + width / 2,
        y
      );
    }
  }

  // Return path and create symmetrical other side
  for (let i = segments; i >= 0; i--) {
    const y = baseY - i * segmentHeight;
    const curve = Math.sin(i * 0.6) * (12 - i * 1.2);
    const width = baseWidth * (1 - (i / segments) * 0.6);

    if (i === segments) {
      path.lineTo(baseX + curve - width / 2, y);
    } else {
      const nextY = baseY - (i + 1) * segmentHeight;
      const nextCurve = Math.sin((i + 1) * 0.6) * (12 - (i + 1) * 1.2);

      path.quadTo(
        baseX + nextCurve - width / 2,
        (nextY + y) / 2,
        baseX + curve - width / 2,
        y
      );
    }
  }

  path.close();
  return path;
};

interface SeaweedStrand {
  id: number;
  x: number;
  height: number;
  swayOffset: number;
  color: string;
}

const SeaweedLayer = () => {
  const translateX = useSharedValue(0);

  // Create seamless loop
  const loopWidth = SCREEN_WIDTH * 1.5;

  // Generate seaweed positions once
  const seaweeds = useMemo((): SeaweedStrand[] => {
    const count = 15;
    const strands: SeaweedStrand[] = [];

    for (let i = 0; i < count; i++) {
      strands.push({
        id: i,
        x: (loopWidth / count) * i + Math.random() * 40,
        height: 45 + Math.random() * 45,
        swayOffset: Math.random() * Math.PI * 2,
        color: `rgba(0, 0, 0, ${0.12 + Math.random() * 0.06})`,
      });
    }

    return strands;
  }, [loopWidth]);

  useEffect(() => {
    // Faster scroll than floor for parallax depth
    translateX.value = withRepeat(
      withTiming(-loopWidth, {
        duration: 6000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [loopWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: loopWidth * 2,
          height: 120,
        },
        animatedStyle,
      ]}
    >
      <Canvas style={{ width: loopWidth * 2, height: 120 }}>
        {/* First segment */}
        <Group>
          {seaweeds.map((seaweed) => {
            const path = createSeaweedPath(seaweed.x, seaweed.height);
            return (
              <Path key={`sw1-${seaweed.id}`} path={path} color={seaweed.color}>
                <LinearGradient
                  start={vec(seaweed.x, 120)}
                  end={vec(seaweed.x, 120 - seaweed.height)}
                  colors={[
                    seaweed.color,
                    seaweed.color.replace(/[\d.]+\)/, '0.06)'),
                  ]}
                />
              </Path>
            );
          })}
        </Group>

        {/* Second segment (cloned) */}
        <Group>
          {seaweeds.map((seaweed) => {
            const path = createSeaweedPath(
              seaweed.x + loopWidth,
              seaweed.height
            );
            return (
              <Path key={`sw2-${seaweed.id}`} path={path} color={seaweed.color}>
                <LinearGradient
                  start={vec(seaweed.x + loopWidth, 120)}
                  end={vec(seaweed.x + loopWidth, 120 - seaweed.height)}
                  colors={[
                    seaweed.color,
                    seaweed.color.replace(/[\d.]+\)/, '0.06)'),
                  ]}
                />
              </Path>
            );
          })}
        </Group>
      </Canvas>
    </Animated.View>
  );
};

export const Seaweed = () => {
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 120,
        overflow: 'hidden',
      }}
      pointerEvents='none'
    >
      <SeaweedLayer />
    </View>
  );
};
