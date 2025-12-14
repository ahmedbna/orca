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
  Skia,
  Path,
  LinearGradient,
  vec,
} from '@shopify/react-native-skia';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SeaweedProps {
  height?: number;
  speed?: number;
  count?: number;
  color?: string;
  direction?: 'left' | 'right';
}

const createSeaweedPath = (
  baseX: number,
  height: number,
  canvasHeight: number,
  segments: number = 8
) => {
  const path = Skia.Path.Make();
  const segmentHeight = height / segments;
  const baseWidth = 8;
  const baseY = canvasHeight;

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

export const Seaweed = ({
  height = 120,
  speed = 6000,
  count = 15,
  color = 'rgba(0, 0, 0, 0.15)',
  direction = 'left',
}: SeaweedProps = {}) => {
  const translateX = useSharedValue(
    direction === 'left' ? 0 : -SCREEN_WIDTH * 1.5
  );
  const loopWidth = SCREEN_WIDTH * 1.5;

  const seaweeds = useMemo((): SeaweedStrand[] => {
    const strands: SeaweedStrand[] = [];

    for (let i = 0; i < count; i++) {
      strands.push({
        id: i,
        x: (loopWidth / count) * i + Math.random() * 40,
        height: 45 + Math.random() * 45,
        swayOffset: Math.random() * Math.PI * 2,
        color: color.includes('rgba')
          ? color
          : `rgba(0, 0, 0, ${0.12 + Math.random() * 0.06})`,
      });
    }

    return strands;
  }, [loopWidth, count, color]);

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

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 220,
        left: 0,
        right: 0,
        height: height,
        overflow: 'hidden',
      }}
      pointerEvents='none'
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
          <Group>
            {seaweeds.map((seaweed) => {
              const path = createSeaweedPath(seaweed.x, seaweed.height, height);
              return (
                <Path
                  key={`sw1-${seaweed.id}`}
                  path={path}
                  color={seaweed.color}
                >
                  <LinearGradient
                    start={vec(seaweed.x, height)}
                    end={vec(seaweed.x, height - seaweed.height)}
                    colors={[
                      seaweed.color,
                      seaweed.color.replace(/[\d.]+\)/, '0.06)'),
                    ]}
                  />
                </Path>
              );
            })}
          </Group>

          <Group>
            {seaweeds.map((seaweed) => {
              const path = createSeaweedPath(
                seaweed.x + loopWidth,
                seaweed.height,
                height
              );
              return (
                <Path
                  key={`sw2-${seaweed.id}`}
                  path={path}
                  color={seaweed.color}
                >
                  <LinearGradient
                    start={vec(seaweed.x + loopWidth, height)}
                    end={vec(seaweed.x + loopWidth, height - seaweed.height)}
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
    </View>
  );
};
