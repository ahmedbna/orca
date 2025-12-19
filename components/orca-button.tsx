import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';

const COLORS = {
  yellow: {
    face: '#FAD40B',
    shadow: '#E5C000',
    text: '#000000',
    border: 'rgba(0,0,0,0.1)',
  },
  white: {
    face: '#FFFFFF',
    shadow: '#D1D5DB',
    text: '#000000',
    border: 'rgba(0,0,0,0.1)',
  },
  black: {
    face: '#000000',
    shadow: '#2A2A2A',
    text: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  gray: {
    face: '#E5E7EB',
    shadow: '#AFB2B7',
    text: '#AFB2B7',
    border: 'rgba(0,0,0,0.1)',
  },
  green: {
    face: '#34C759',
    shadow: '#46A302',
    text: '#FFFFFF',
    border: 'rgba(0,0,0,0.1)',
  },
};

const BUTTON_SHADOW_HEIGHT = 8;

export const OrcaButton = ({
  onPress,
  label,
  variant = 'yellow',
}: {
  onPress: () => void;
  label: string;
  variant?: 'yellow' | 'green';
}) => {
  const pulse = useSharedValue(1);
  const pressed = useSharedValue(0);

  const colors = variant === 'yellow' ? COLORS.yellow : COLORS.green;

  const animatedFaceStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      pressed.value,
      [0, 1],
      [0, BUTTON_SHADOW_HEIGHT]
    );
    return {
      transform: [{ translateY }, { scale: pulse.value }],
    };
  });

  const handlePressIn = () => {
    pressed.value = withSpring(1, { damping: 15 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 15 });
    onPress();
  };

  return (
    <Animated.View>
      {/* Shadow */}
      <View
        style={[
          {
            backgroundColor: colors.shadow,
            top: BUTTON_SHADOW_HEIGHT,
            position: 'absolute',
            left: 0,
            right: 0,
            height: 64,
            borderRadius: 999,
            zIndex: 1,
          },
        ]}
      />

      {/* Face */}
      <Animated.View
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        style={[
          {
            backgroundColor: colors.face,
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 64,
            borderRadius: 999,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2,
            borderWidth: 4,
            borderColor: colors.border,
          },
          animatedFaceStyle,
        ]}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};
