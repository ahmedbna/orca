import { Platform, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Image } from '@/components/ui/image';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { FONT_SIZE } from '@/theme/globals';

const AVATAR_SHADOW_OFFSET = 6;

const COLORS = {
  yellow: {
    face: '#FAD40B',
    shadow: '#E5C000',
    text: '#000000',
  },
  green: {
    face: '#34C759',
    shadow: '#2E9E4E',
    text: '#FFFFFF',
  },
  indigo: {
    face: '#5E5CE6',
    shadow: '#3F3DB8',
    text: '#FFFFFF',
  },
  red: {
    face: '#FF3B30',
    shadow: '#C1271D',
    text: '#FFFFFF',
  },
  black: {
    face: '#000000',
    shadow: '#2A2A2A',
    text: '#FFFFFF',
  },
  gray: {
    face: '#E5E7EB',
    shadow: '#AFB2B7',
    text: '#000000',
  },
};

type Variant = keyof typeof COLORS;

interface Props {
  size?: number;
  image?: string | null;
  name?: string | null;
  variant?: Variant;
  onPress?: () => void;
}

export const Avatar = ({
  size = 40,
  image,
  name,
  variant = 'indigo',
  onPress,
}: Props) => {
  const colors = COLORS[variant];
  const pressed = useSharedValue(0);

  const animatedFaceStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            pressed.value,
            [0, 1],
            [0, AVATAR_SHADOW_OFFSET]
          ),
        },
      ],
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
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
        pressed.value = withSpring(1, { damping: 16 });
      }}
      onPressOut={() => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        pressed.value = withSpring(0, { damping: 16 });
      }}
      style={{
        width: size,
        height: size,
      }}
    >
      {/* Shadow (outside layout, circular) */}
      <View
        pointerEvents='none'
        style={{
          position: 'absolute',
          top: AVATAR_SHADOW_OFFSET,
          left: 0,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.shadow,
        }}
      />

      {/* Face (true circle) */}
      <Animated.View
        pointerEvents='none'
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.face,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderWidth: 3,
            borderColor: 'rgba(0,0,0,0.15)',
          },
          animatedFaceStyle,
        ]}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={{ width: '100%', height: '100%' }}
            contentFit='cover'
          />
        ) : (
          <Text
            style={{
              color: colors.text,
              fontSize: FONT_SIZE,
              fontWeight: '800',
            }}
          >
            {name
              ?.trim()
              .split(/\s+/)
              .map((part) => part[0]?.toUpperCase())
              .join('')}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
};
