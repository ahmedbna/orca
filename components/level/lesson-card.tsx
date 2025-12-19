import { View, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Text } from '../ui/text';
import { ChevronRight } from 'lucide-react-native';
import { Doc } from '@/convex/_generated/dataModel';
import { useRouter } from 'expo-router';

const SHADOW_HEIGHT = 6;
const HORIZONTAL_PADDING = 16;

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

  const handlePressIn = () => {
    pressed.value = withSpring(1, { damping: 15 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 15 });
  };

  return (
    <Pressable
      onPress={() => router.push(`/study/${lesson._id}`)}
      style={styles.wrapper}
    >
      {/* Shadow */}
      <View style={styles.shadow} />

      {/* Face */}
      <Animated.View
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        style={[styles.face, animatedFaceStyle]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={{
              color: '#000',
              backgroundColor: '#FAD40B',
              borderRadius: 999,
              padding: 4,
              fontWeight: 800,
            }}
          >
            {lesson.order < 10 ? `0${lesson.order}` : lesson.order}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#aaa', fontWeight: 800 }}>STUDY</Text>
            <ChevronRight size={26} color='#aaa' />
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
    backgroundColor: '#000',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
