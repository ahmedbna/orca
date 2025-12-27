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
    face: '#D1D5DB',
    shadow: '#AFB2B7',
    text: '#000',
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
  indigo: {
    face: '#5E5CE6',
    shadow: '#3F3DB8',
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

export const OrcaSquareButton = ({
  onPress,
  label,
  variant = 'yellow',
  disabled = false,
  flex = 1,
}: {
  onPress: () => void;
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  flex?: number;
}) => {
  const pressed = useSharedValue(0);
  const colors = COLORS[disabled ? 'gray' : variant];

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      pressed.value,
      [0, 1],
      [0, disabled ? 0 : 8]
    );
    return { transform: [{ translateY }] };
  });

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        if (!disabled) pressed.value = withSpring(1, { damping: 15 });
      }}
      onPressOut={() => {
        if (!disabled) pressed.value = withSpring(0, { damping: 15 });
      }}
      style={{ flex, height: 64, opacity: disabled ? 0.6 : 1 }}
    >
      {/* Shadow */}
      <View
        pointerEvents='none'
        style={{
          position: 'absolute',
          top: 8,
          left: 0,
          right: 0,
          height: 64,
          backgroundColor: colors.shadow,
          borderRadius: 20,
        }}
      />

      {/* Face */}
      <Animated.View
        pointerEvents='none'
        style={[
          {
            height: 64,
            backgroundColor: colors.face,
            borderRadius: 20,
            borderWidth: 4,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          },
          animatedStyle,
        ]}
      >
        <Text style={{ fontSize: 22, fontWeight: '900', color: colors.text }}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};
