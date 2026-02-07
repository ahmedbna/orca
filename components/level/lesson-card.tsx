import { View, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/text';
import { Doc } from '@/convex/_generated/dataModel';

const SHADOW_HEIGHT = 6;
const HORIZONTAL_PADDING = 16;

const COLOR = {
  face: '#5E5CE6',
  shadow: '#3F3DB8',
  text: '#FFFFFF',
  border: 'rgba(0,0,0,0.15)',
};

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style);
  }
};

type Props = {
  lesson: Doc<'lessons'>;
};

export const LessonCard = ({ lesson }: Props) => {
  const router = useRouter();
  const pressed = useSharedValue(0);
  const pulse = useSharedValue(1);

  const animatedFaceStyle = useAnimatedStyle(() => {
    const translateY = interpolate(pressed.value, [0, 1], [0, SHADOW_HEIGHT]);
    return {
      transform: [{ translateY }, { scale: pulse.value }],
    };
  });

  return (
    <Pressable
      onPress={() => router.push(`/study/${lesson._id}`)}
      onPressIn={() => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
        pressed.value = withSpring(1, { damping: 16 });
      }}
      onPressOut={() => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        pressed.value = withSpring(0, { damping: 16 });
      }}
      style={{
        flex: 1,
        paddingBottom: SHADOW_HEIGHT,
      }}
    >
      {/* Shadow */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: SHADOW_HEIGHT,
          bottom: 0,
          borderRadius: 24,
          backgroundColor: COLOR.shadow,
          zIndex: 1,
        }}
      />

      {/* Face */}
      <Animated.View
        style={[
          {
            backgroundColor: COLOR.face,
            borderRadius: 24,
            padding: HORIZONTAL_PADDING,
            gap: 12,
            zIndex: 2,
            borderWidth: 4,
            borderColor: COLOR.border,
            justifyContent: 'center',
          },
          animatedFaceStyle,
        ]}
      >
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text
            style={{
              fontSize: 24,
            }}
          >
            📚
          </Text>
          <Text
            style={{
              color: COLOR.text,
              fontSize: 20,
              fontWeight: '800',
            }}
          >
            STUDY
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};
