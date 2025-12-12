import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CloudsProps {
  clouds?: Array<{
    y?: number;
    size?: number;
    speed?: number;
    opacity?: number;
    color?: string;
  }>;
  direction?: 'left' | 'right';
}

interface CloudElementProps {
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
  direction: 'left' | 'right';
}

const CloudElement = ({
  y,
  size,
  speed,
  opacity,
  color,
  direction,
}: CloudElementProps) => {
  const translateX = useSharedValue(
    direction === 'left' ? SCREEN_WIDTH : -size * 2
  );

  useEffect(() => {
    const target = direction === 'left' ? -size * 2 : SCREEN_WIDTH;
    translateX.value = withRepeat(
      withTiming(target, { duration: 15000 / speed, easing: Easing.linear }),
      -1,
      false
    );
  }, [speed, size, direction]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: y,
          width: size,
          height: size * 0.6,
          borderRadius: size * 0.3,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
};

export const Clouds = ({ clouds, direction = 'left' }: CloudsProps = {}) => {
  const defaultClouds = [
    {
      y: SCREEN_HEIGHT * 0.2,
      size: 80,
      speed: 0.3,
      opacity: 0.3,
      color: 'rgba(255, 255, 255, 0.3)',
    },
    {
      y: SCREEN_HEIGHT * 0.25,
      size: 60,
      speed: 0.3,
      opacity: 0.4,
      color: 'rgba(255, 255, 255, 0.4)',
    },
    {
      y: SCREEN_HEIGHT * 0.28,
      size: 80,
      speed: 0.4,
      opacity: 0.3,
      color: 'rgba(255, 255, 255, 0.3)',
    },
    {
      y: SCREEN_HEIGHT * 0.3,
      size: 50,
      speed: 0.25,
      opacity: 0.35,
      color: 'rgba(255, 255, 255, 0.35)',
    },
    {
      y: SCREEN_HEIGHT * 0.32,
      size: 50,
      speed: 0.15,
      opacity: 0.35,
      color: 'rgba(255, 255, 255, 0.35)',
    },
    {
      y: SCREEN_HEIGHT * 0.35,
      size: 70,
      speed: 0.35,
      opacity: 0.25,
      color: 'rgba(255, 255, 255, 0.25)',
    },
  ];

  const finalClouds = clouds || defaultClouds;

  return (
    <>
      {finalClouds.map((cloud, i) => (
        <CloudElement
          key={i}
          y={cloud.y || SCREEN_HEIGHT * 0.3}
          size={cloud.size || 60}
          speed={cloud.speed || 0.3}
          opacity={cloud.opacity || 0.3}
          color={cloud.color || `rgba(255, 255, 255, ${cloud.opacity || 0.3})`}
          direction={direction}
        />
      ))}
    </>
  );
};
