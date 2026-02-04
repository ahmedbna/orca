import { Platform, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Spinner } from '@/components/ui/spinner';
import * as Haptics from 'expo-haptics';

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
    face: '#1FD65F', // More saturated & lively
    shadow: '#18A94A', // Deeper contrast shadow
    text: '#FFFFFF', // Stays perfect
    border: 'rgba(0,0,0,0.12)',
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

const BUTTON_HEIGHT = 64;
const BUTTON_SHADOW_HEIGHT = 8;

type ButtonVariant = keyof typeof COLORS;
type ButtonShape = 'pill' | 'rounded';

export const OrcaButton = ({
  onPress,
  label,
  variant = 'yellow',
  shape = 'pill',
  disabled = false,
  loading = false,
  icon,
  style,
}: {
  onPress: () => void;
  label: string;
  variant?: ButtonVariant;
  shape?: ButtonShape;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}) => {
  const pressed = useSharedValue(0);
  const colors = COLORS[disabled ? 'gray' : variant];

  const radius = shape === 'pill' ? 999 : 20;

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      pressed.value,
      [0, 1],
      [0, disabled ? 0 : BUTTON_SHADOW_HEIGHT],
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
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={() => {
        if (!disabled) pressed.value = withSpring(1, { damping: 15 });
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => {
        if (!disabled) pressed.value = withSpring(0, { damping: 15 });
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      }}
      style={[
        {
          height: BUTTON_HEIGHT,
          width: '100%',
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {/* Shadow */}
      <View
        pointerEvents='none'
        style={{
          position: 'absolute',
          top: BUTTON_SHADOW_HEIGHT,
          width: '100%',
          height: BUTTON_HEIGHT,
          backgroundColor: colors.shadow,
          borderRadius: radius,
        }}
      />

      {/* Face */}
      <Animated.View
        pointerEvents='none'
        style={[
          {
            position: 'absolute',
            top: 0,
            width: '100%',
            height: BUTTON_HEIGHT,
            backgroundColor: colors.face,
            borderRadius: radius,
            borderWidth: 4,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          },
          animatedStyle,
        ]}
      >
        {loading ? (
          <Spinner variant='dots' color={colors.text} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {icon}
            <Text
              style={{
                fontSize: 22,
                fontWeight: '800',
                color: colors.text,
              }}
            >
              {label}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};
