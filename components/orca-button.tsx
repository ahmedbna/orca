import { Platform, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
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
    border: 'rgba(255,255,255,0.1)',
  },
  gray: {
    face: '#E5E7EB',
    shadow: '#AFB2B7',
    text: '#6B7280',
    border: 'rgba(0,0,0,0.1)',
  },
  green: {
    face: '#34C759',
    shadow: '#2E9E4E',
    text: '#FFFFFF',
    border: 'rgba(0,0,0,0.1)',
  },
  red: {
    face: '#FF3B30',
    shadow: '#C1271D',
    text: '#FFFFFF',
    border: 'rgba(0,0,0,0.15)',
  },
} as const;

const BUTTON_SHADOW_HEIGHT = 8;

type ButtonVariant = keyof typeof COLORS;

export const OrcaButton = ({
  onPress,
  label,
  variant = 'yellow',
}: {
  onPress: () => void;
  label: string;
  variant?: ButtonVariant;
}) => {
  const pressed = useSharedValue(0);
  const colors = COLORS[variant];

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      pressed.value,
      [0, 1],
      [0, BUTTON_SHADOW_HEIGHT]
    );
    return {
      transform: [{ translateY }],
    };
  });

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withSpring(1, { damping: 15 });
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 15 });
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      }}
      style={{ height: 64 }}
    >
      {/* Shadow */}
      <View
        pointerEvents='none'
        style={{
          backgroundColor: colors.shadow,
          position: 'absolute',
          top: BUTTON_SHADOW_HEIGHT,
          left: 0,
          right: 0,
          height: 64,
          borderRadius: 999,
          zIndex: 1,
        }}
      />

      {/* Face */}
      <Animated.View
        pointerEvents='none'
        style={[
          {
            backgroundColor: colors.face,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 64,
            borderRadius: 999,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2,
            borderWidth: 4,
            borderColor: colors.border,
          },
          animatedStyle,
        ]}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: 22,
            fontWeight: '800',
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};
