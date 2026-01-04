import React from 'react';
import { StyleSheet, Platform, Pressable, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { ScrollView } from '@/components/ui/scroll-view';
import { Spinner } from '@/components/ui/spinner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { osName } from 'expo-device';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style);
  }
};

// Vibrant color schemes for courses
const courseColors = [
  { bg: '#6C63FF', shadow: '#4B45CC' }, // Purple
  { bg: '#FF6B9D', shadow: '#CC5680' }, // Pink
  { bg: '#4ECDC4', shadow: '#3BA399' }, // Teal
  { bg: '#FF8C42', shadow: '#CC7035' }, // Orange
  { bg: '#95E1D3', shadow: '#76B4A9' }, // Mint
  { bg: '#F38181', shadow: '#C26767' }, // Coral
  { bg: '#AA96DA', shadow: '#8878AE' }, // Lavender
  { bg: '#FCBAD3', shadow: '#CA9AAF' }, // Rose
];

const CourseCard = ({
  course,
  index,
  onPress,
}: {
  course: any;
  index: number;
  onPress: () => void;
}) => {
  const pressed = useSharedValue(0);
  const colors = courseColors[index % courseColors.length];

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(pressed.value, [0, 1], [0, 6]);
    return {
      transform: [{ translateY }],
    };
  });

  const getStatusEmoji = () => {
    if (course.isCompleted) return '🎉';
    if (course.isCurrent) return '🔥';
    if (!course.isUnlocked) return '🔒';
    return '📚';
  };

  const getStatusText = () => {
    if (course.isCompleted) return 'Completed';
    if (course.isCurrent) return 'Current';
    if (!course.isUnlocked) return 'Locked';
    return 'Available';
  };

  return (
    <Animated.View style={styles.courseContainer}>
      {/* Shadow layer */}
      <View
        style={[
          styles.courseShadow,
          {
            backgroundColor: colors.shadow,
            top: 8,
            opacity: course.isUnlocked ? 1 : 0.5,
          },
        ]}
      />

      {/* Main card */}
      <Pressable
        onPress={course.isUnlocked ? onPress : undefined}
        onPressIn={() => {
          if (course.isUnlocked) {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            pressed.value = withSpring(1, { damping: 16 });
          }
        }}
        onPressOut={() => {
          if (course.isUnlocked) {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
            pressed.value = withSpring(0, { damping: 16 });
          }
        }}
      >
        <Animated.View
          style={[
            styles.courseCard,
            {
              backgroundColor: colors.bg,
              opacity: course.isUnlocked ? 1 : 0.6,
            },
            animatedStyle,
          ]}
        >
          <View style={styles.courseContent}>
            {/* Status Badge */}
            <View style={styles.statusBadge}>
              <Text style={styles.statusEmoji}>{getStatusEmoji()}</Text>
            </View>

            {/* Course Info */}
            <View style={styles.infoSection}>
              <Text variant='title' style={styles.courseTitle}>
                {course.title}
              </Text>
              <Text style={styles.courseDescription}>{course.description}</Text>
            </View>
          </View>

          {/* Status Label */}
          <View style={styles.statusLabel}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export default function CoursesScreen() {
  const colorScheme = useColorScheme() || 'light';
  const insets = useSafeAreaInsets();
  const courses = useQuery(api.courses.getAll);

  const text =
    colorScheme === 'light' && isLiquidGlassAvailable() && osName !== 'iPadOS'
      ? '#000'
      : '#FFF';

  if (courses === undefined) {
    return (
      <View style={styles.centerContainer}>
        <Spinner size='lg' variant='circle' color='#000000' />
      </View>
    );
  }

  if (courses === null || courses.length === 0) {
    return (
      <View style={[styles.centerContainer, { padding: 16 }]}>
        <Text variant='heading' style={{ marginBottom: 8, color: text }}>
          No Courses Available
        </Text>
        <Text style={{ textAlign: 'center', color: text, opacity: 0.7 }}>
          Please select a learning language to view available courses.
        </Text>
      </View>
    );
  }

  const handleCoursePress = (courseId: string) => {
    // Navigate to course detail or start course
    console.log('Course pressed:', courseId);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior='automatic'
      contentContainerStyle={{
        padding: 16,
        paddingTop: 40,
        paddingBottom: insets.bottom + 32,
      }}
    >
      <Text variant='heading' style={[styles.heading, { color: text }]}>
        Your Courses
      </Text>
      <Text style={[styles.subheading, { color: text }]}>
        Continue your learning journey
      </Text>

      {courses.map((course, index) => (
        <CourseCard
          key={course._id}
          course={course}
          index={index}
          onPress={() => handleCoursePress(course._id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    marginBottom: 8,
  },
  subheading: {
    marginBottom: 24,
    opacity: 0.7,
  },
  courseContainer: {
    position: 'relative',
    height: 150,
    marginBottom: 8,
  },
  courseShadow: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: 0,
    height: 140,
    borderRadius: 28,
  },
  courseCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 140,
    borderRadius: 28,
    borderWidth: 5,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
  },
  courseContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  statusEmoji: {
    fontSize: 24,
  },
  infoSection: {
    flex: 1,
    paddingRight: 60,
  },
  courseTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  courseDescription: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statusLabel: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'absolute',
    bottom: 8,
    right: 16,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
