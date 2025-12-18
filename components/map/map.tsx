import React, { useMemo, useEffect, useRef } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  withSpring,
  useAnimatedStyle,
  interpolate,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Streak } from '@/components/map/streak';
import { SquishyButton } from '@/components/map/squishy-button';
import { Background } from '@/components/background';
import { Doc } from '@/convex/_generated/dataModel';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- THEME CONSTANTS ---
const COLORS = {
  background: '#FAD40B', // Orca Yellow
  locked: {
    face: '#E5E7EB',
    shadow: '#AFB2B7',
    text: '#AFB2B7',
  },
  active: {
    face: '#FFFFFF', // White face for active to make icon pop
    shadow: '#D1D5DB',
  },
  completed: {
    face: '#34C759', // Duolingo Green
    shadow: '#46A302',
    text: '#FFFFFF',
  },
  path: 'rgba(255, 255, 255, 0.4)',
};

const VERTICAL_SPACING = 100;
const AMPLITUDE = SCREEN_WIDTH * 0.3;
const BUTTON_SHADOW_HEIGHT = 8;

// --- TYPES ---
type LevelStatus = 'locked' | 'active' | 'completed';

export interface LevelData {
  id: number;
  order: number;
  title: string;
  status: LevelStatus;
}

// --- MOCK DATA ---
const LEVELS: LevelData[] = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  order: i + 1,
  title: `Level ${i + 1}`,
  stars: i < 5 ? 3 : i === 5 ? 0 : 0,
  status: i < 5 ? 'completed' : i === 5 ? 'active' : 'locked',
}));

// 3D Button Component
const Button3D = ({
  onPress,
  label,
  variant = 'yellow',
}: {
  onPress: () => void;
  label: string;
  variant?: 'yellow' | 'green';
}) => {
  const pressed = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const colors =
    variant === 'yellow'
      ? { face: COLORS.background, shadow: '#E5C000' }
      : COLORS.completed;

  const animatedFaceStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      pressed.value,
      [0, 1],
      [0, BUTTON_SHADOW_HEIGHT]
    );
    return {
      transform: [{ translateY }, { scale: pulse.value }],
    };
  });

  const handlePressIn = () => {
    pressed.value = withSpring(1, { damping: 15 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 15 });
    onPress();
  };

  return (
    <Animated.View style={{ height: 100 }}>
      {/* Shadow */}
      <View
        style={[
          styles.button3DShadow,
          {
            backgroundColor: colors.shadow,
            top: BUTTON_SHADOW_HEIGHT,
          },
        ]}
      />
      {/* Face */}
      <Animated.View
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        style={[
          styles.button3DFace,
          {
            backgroundColor: colors.face,
          },
          animatedFaceStyle,
        ]}
      >
        <Text
          variant='title'
          style={{
            color: variant === 'yellow' ? '#000' : '#FFF',
            fontSize: 18,
            fontWeight: '900',
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

type Props = {
  course: Doc<'courses'> & {
    lessons: Array<
      Doc<'lessons'> & {
        score: number;
        status: 'locked' | 'active' | 'completed';
        isUnlocked: boolean;
        isCompleted: boolean;
      }
    >;
  };
};

export const Map = ({ course }: Props) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const scrollY = useSharedValue(0);

  // Calculation logic
  const totalHeight = LEVELS.length * VERTICAL_SPACING + 400; // Extra padding at bottom
  const centerX = SCREEN_WIDTH / 2;

  const levelCoords = useMemo(() => {
    return LEVELS.map((level, index) => {
      // Invert Y so level 1 is at the bottom
      const y = totalHeight - (index * VERTICAL_SPACING + 400);
      // Sine wave for X
      const x = centerX + Math.sin(index * 0.55) * AMPLITUDE;
      return { ...level, x, y };
    });
  }, [totalHeight]);

  const handleLevelPress = (id: number) => {
    router.push(`/level/${id}`);
    console.log(`Open Level ${id}`);
  };

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
    <Background>
      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={{ height: totalHeight }}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Draw Nodes */}
        {levelCoords.map((level) => (
          <SquishyButton
            key={level.id}
            level={level}
            x={level.x}
            y={level.y}
            onPress={handleLevelPress}
          />
        ))}
      </Animated.ScrollView>

      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom }]}>
        <Streak />

        <Button3D
          label='START'
          variant='green'
          onPress={() => console.log('Start pressed')}
        />
      </View>

      {/* <Music /> */}
    </Background>
  );
};

const styles = StyleSheet.create({
  oceanContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  button3DFace: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 92,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  button3DShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 92,
    borderRadius: 24,
    zIndex: 1,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFE17B',
    padding: 16,
    gap: 8,
    height: 300,
    overflow: 'visible',
  },
});
