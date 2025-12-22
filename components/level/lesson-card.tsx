import { View, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/text';
import { ChevronRight } from 'lucide-react-native';
import { Doc } from '@/convex/_generated/dataModel';
import { useRouter } from 'expo-router';
import { useColor } from '@/hooks/useColor';

const SHADOW_HEIGHT = 6;
const HORIZONTAL_PADDING = 16;

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

  const yellow = useColor('orca');

  const animatedFaceStyle = useAnimatedStyle(() => {
    const translateY = interpolate(pressed.value, [0, 1], [0, SHADOW_HEIGHT]);
    return {
      transform: [{ translateY }, { scale: pulse.value }],
    };
  });

  return (
    <Pressable
      onPress={() => router.push(`/(home)/study/${lesson._id}`)}
      onPressIn={() => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
        pressed.value = withSpring(1, { damping: 16 });
      }}
      onPressOut={() => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        pressed.value = withSpring(0, { damping: 16 });
      }}
      style={styles.wrapper}
    >
      {/* Shadow */}
      <View style={styles.shadow} />

      {/* Face */}
      <Animated.View style={[styles.face, animatedFaceStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={{
              color: '#000',
              backgroundColor: yellow,
              borderRadius: 999,
              padding: 6,
              fontWeight: '800',
              fontSize: 14,
            }}
          >
            {lesson.order < 10 ? `0${lesson.order}` : lesson.order}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: yellow, fontWeight: '800' }}>STUDY</Text>
            <ChevronRight size={26} color={yellow} />
          </View>
        </View>

        <View style={styles.container}>
          <Text style={styles.title}>{lesson.title}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: SHADOW_HEIGHT, // Space for shadow
  },
  shadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SHADOW_HEIGHT,
    bottom: 0,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    zIndex: 1,
  },
  face: {
    backgroundColor: '#000000',
    borderRadius: 24,
    padding: HORIZONTAL_PADDING,
    gap: 12,
    zIndex: 2,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
