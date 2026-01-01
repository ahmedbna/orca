import React, { useMemo, useEffect, useRef } from 'react';
import { Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Streak } from '@/components/map/streak';
import { SquishyButton } from '@/components/map/squishy-button';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { LANGUAGES } from '@/constants/languages';
import { OrcaButton } from '@/components/squishy/orca-button';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const VERTICAL_SPACING = 96;
const AMPLITUDE = SCREEN_WIDTH * 0.32;

type Props = {
  course: Doc<'courses'> & {
    lessons: Array<
      Doc<'lessons'> & {
        status: 'locked' | 'active' | 'completed';
      }
    >;
  };
  streak: number;
};

export const Map = ({ course, streak }: Props) => {
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  // Calculation logic
  const totalHeight = course.lessons.length * VERTICAL_SPACING + 420; // Extra padding at bottom
  const centerX = SCREEN_WIDTH / 2;

  const levelCoords = useMemo(() => {
    return course.lessons.map((level, index) => {
      // Invert Y so level 1 is at the bottom
      const y = totalHeight - (index * VERTICAL_SPACING + 420);
      // Sine wave for X
      const x = centerX + Math.sin(index * 0.55) * AMPLITUDE;
      return { ...level, x, y };
    });
  }, [course.lessons, totalHeight]);

  const handleLevelPress = (lessonId: Id<'lessons'>) => {
    router.push(`/(home)/level/${lessonId}`);
  };

  const currentLesson = useMemo(() => {
    return course.lessons.find((l) => l.status === 'active');
  }, [course.lessons]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Auto-scroll to active level on mount
  useEffect(() => {
    const activeLevel = levelCoords.find((l) => l.status === 'active');
    if (activeLevel && scrollViewRef.current) {
      // Center the active level
      const targetY = activeLevel.y - SCREEN_HEIGHT * 0.5;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, targetY),
          animated: false,
        });
      }, 100);
    } else {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [levelCoords]);

  return (
    <View style={{ flex: 1 }}>
      <Animated.ScrollView
        ref={scrollViewRef}
        style={{
          flex: 1,
        }}
        contentContainerStyle={{ height: totalHeight }}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Draw Nodes */}
        {levelCoords.map((level) => (
          <SquishyButton
            key={level._id}
            level={level}
            x={level.x}
            y={level.y}
            onPress={() => handleLevelPress(level._id)}
          />
        ))}
      </Animated.ScrollView>

      <View
        style={[
          {
            paddingBottom: insets.bottom,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#F6C90E',
            paddingHorizontal: 16,
            gap: 12,
            height: insets.bottom + 240,
            overflow: 'hidden',
            zIndex: 99,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.push('/courses')}
          style={{
            flexDirection: 'row',
            gap: 2,
            alignItems: 'center',
            flex: 1, // 👈 allows truncation
            marginRight: 12, // spacing from speed button
          }}
        >
          <Text variant='heading'>
            {LANGUAGES.find((lang) => lang.code === course.language)?.flag}
          </Text>
          <Text
            variant='title'
            numberOfLines={1}
            ellipsizeMode='tail'
            style={{
              fontSize: 22,
              color: '#000',
              fontWeight: '800',
              opacity: 0.7,
              flexShrink: 1, // 👈 critical for row layouts
            }}
          >
            {course.title}
          </Text>
        </TouchableOpacity>

        <Streak streak={streak} onPress={() => router.push('/streak')} />

        <OrcaButton
          label='START'
          variant='green'
          onPress={() =>
            currentLesson && router.push(`/(home)/level/${currentLesson._id}`)
          }
        />
      </View>
    </View>
  );
};
