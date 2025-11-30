import { useEffect } from 'react';
import { Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const clouds = [
  { y: SCREEN_HEIGHT * 0.2, size: 80, speed: 0.3, opacity: 0.3 },
  { y: SCREEN_HEIGHT * 0.25, size: 60, speed: 0.3, opacity: 0.4 },
  { y: SCREEN_HEIGHT * 0.28, size: 80, speed: 0.4, opacity: 0.3 },
  { y: SCREEN_HEIGHT * 0.3, size: 50, speed: 0.25, opacity: 0.35 },
  { y: SCREEN_HEIGHT * 0.32, size: 50, speed: 0.15, opacity: 0.35 },
  { y: SCREEN_HEIGHT * 0.35, size: 70, speed: 0.35, opacity: 0.25 },
];

export const Clouds = () => {
  return clouds.map((cloud, i) => <CloudElement key={i} {...cloud} />);
};

const CloudElement = ({
  y,
  size,
  speed,
  opacity,
}: {
  y: number;
  size: number;
  speed: number;
  opacity: number;
}) => {
  const translateX = useSharedValue(SCREEN_WIDTH);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(-size * 2, { duration: 15000 / speed, easing: Easing.linear }),
      -1,
      false
    );
  }, [speed, size]);

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
          backgroundColor: `rgba(255, 255, 255, ${opacity})`,
        },
        style,
      ]}
    />
  );
};
