// components/courses.tsx
import React from 'react';
import { StyleSheet, Platform, Pressable, FlatList } from 'react-native';
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
import { Spinner } from '@/components/ui/spinner';
import { useSubscription } from '@/hooks/useSubscription';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Crown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ALL_LANGUAGES } from '@/constants/languages';
import * as Haptics from 'expo-haptics';

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style);
  }
};

// Vibrant color schemes for courses
const courseColors = [
  { bg: '#5B4FFF', shadow: '#4036C7' }, // Rich Purple
  { bg: '#FF2E7E', shadow: '#C52263' }, // Hot Pink
  { bg: '#00D1C1', shadow: '#009F93' }, // Vibrant Teal
  { bg: '#FF7A1F', shadow: '#CC5E14' }, // Bold Orange
  { bg: '#00C896', shadow: '#009B74' }, // Deep Mint
  { bg: '#FF4B4B', shadow: '#C73838' }, // Strong Coral Red
  { bg: '#8A5CFF', shadow: '#6844C7' }, // Electric Lavender
  { bg: '#FF4FA7', shadow: '#C73C82' }, // Vivid Rose
];

const CourseCard = ({
  course,
  index,
  onPress,
  hasAccess,
}: {
  course: any;
  index: number;
  onPress: () => void;
  hasAccess: boolean;
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
    if (!course.isUnlocked) {
      return course.isPremium && !hasAccess ? '👑' : '🔒';
    }
    return '📚';
  };

  const getStatusText = () => {
    if (course.isCompleted) return 'Completed';
    if (course.isCurrent) return 'Current';
    if (!course.isUnlocked) {
      return course.isPremium && !hasAccess ? 'Premium' : 'Locked';
    }
    return 'Available';
  };

  const isLocked = !course.isUnlocked;
  const isPremiumLocked = course.isPremium && !hasAccess;
  const canPress = course.isUnlocked || isPremiumLocked;

  return (
    <Animated.View style={styles.courseContainer}>
      {/* Shadow layer */}
      <View
        style={[
          styles.courseShadow,
          {
            backgroundColor: colors.shadow,
            top: 8,
            opacity: isLocked ? 0.3 : 1,
          },
        ]}
      />

      {/* Main card */}
      <Pressable
        onPress={canPress ? onPress : undefined}
        onPressIn={() => {
          if (canPress) {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            pressed.value = withSpring(1, { damping: 16 });
          }
        }}
        onPressOut={() => {
          if (canPress) {
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
            },
            animatedStyle,
          ]}
        >
          {/* Premium Badge */}

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

          {isPremiumLocked ? (
            <View
              style={{
                position: 'absolute',
                backgroundColor: '#FAD40B',
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                borderWidth: 2,
                borderColor: 'rgba(0, 0, 0, 0.15)',
                zIndex: 10,
                paddingHorizontal: 12,
                paddingVertical: 6,
                bottom: 8,
                right: 16,
              }}
            >
              <Crown size={12} color='#000' strokeWidth={3} />
              <Text
                style={{
                  color: '#000',
                  fontSize: 14,
                  fontWeight: '800',
                }}
              >
                Orca+
              </Text>
            </View>
          ) : (
            <View style={styles.statusLabel}>
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export const Courses = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const courses = useQuery(api.courses.getAll);
  const hasAccess = useQuery(api.subscriptions.hasAccess);

  const { presentPaywall } = useSubscription();

  if (courses === undefined || hasAccess === undefined) {
    return (
      <View style={styles.centerContainer}>
        <Spinner size='lg' variant='circle' color='#000000' />
      </View>
    );
  }

  if (courses === null || courses.length === 0) {
    return (
      <View style={[styles.centerContainer, { padding: 16 }]}>
        <Text variant='heading' style={{ marginBottom: 8, color: '#000' }}>
          No Courses Available
        </Text>
        <Text style={{ textAlign: 'center', color: '#000', opacity: 0.7 }}>
          Please select a learning language to view available courses.
        </Text>
      </View>
    );
  }

  const handleCoursePress = async (course: any) => {
    if (course.isPremium && !hasAccess) {
      const purchased = await presentPaywall();

      if (purchased) {
        console.log('User purchased subscription!');
        // The subscription hook will handle backend sync
        // User can now navigate to the course
      }
    } else if (course.isUnlocked) {
      // Navigate to course (implement your navigation logic)
      console.log('Course pressed:', course._id);
      router.back();
      // Add navigation to course here if needed
    }
  };

  const language = ALL_LANGUAGES.find(
    (lang) => lang.code === courses[0].language,
  );

  return (
    <FlatList
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingTop: insets.top + 70,
        paddingHorizontal: 16,
        paddingBottom: insets.bottom + 300,
      }}
      data={courses}
      keyExtractor={(item) => item._id}
      renderItem={({ item, index }) => (
        <CourseCard
          key={item._id}
          course={item}
          index={index}
          onPress={() => handleCoursePress(item)}
          hasAccess={hasAccess}
        />
      )}
      ListHeaderComponent={() => (
        <View style={{ marginBottom: 16 }}>
          <Text variant='heading' style={[{ color: '#000' }]}>
            {`${language?.native} Courses ${language?.flag}`}
          </Text>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 14,
    fontWeight: '700',
  },
});
