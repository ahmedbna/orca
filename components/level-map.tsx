import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  useAnimatedStyle,
  withSpring,
  interpolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Jellyfish } from '@/components/orca/jellyfish';
import { Bubbles } from '@/components/orca/bubble';
import { Clouds } from '@/components/orca/clouds';
import { Fish } from '@/components/orca/fish';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/button';
import { Feather } from '@expo/vector-icons';
import { Music } from './orca/music';
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
    // face: '#58CC02', // Duolingo Green
    shadow: '#46A302',
    text: '#FFFFFF',
  },
  path: 'rgba(255, 255, 255, 0.4)',
};

const NODE_SIZE = 86; // Slightly smaller to account for 3D depth
const BUTTON_HEIGHT = 80;
const BUTTON_SHADOW_HEIGHT = 10; // The 3D depth
const VERTICAL_SPACING = 120;
const AMPLITUDE = SCREEN_WIDTH * 0.25;

// --- TYPES ---
type LevelStatus = 'locked' | 'active' | 'completed';

interface LevelData {
  id: number;
  order: number;
  title: string;
  stars: number;
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

const OceanBackground = ({ children }: { children: React.ReactNode }) => {
  return (
    <View style={styles.oceanContainer}>
      <Clouds />
      <Bubbles />
      <Fish />
      <Jellyfish />

      <View style={styles.sunRays} />
      {children}
    </View>
  );
};

const SquishyLevelNode = ({
  level,
  x,
  y,
  onPress,
}: {
  level: LevelData;
  x: number;
  y: number;
  onPress: (id: number) => void;
}) => {
  const isLocked = level.status === 'locked';
  const isActive = level.status === 'active';
  const isCompleted = level.status === 'completed';

  // Animation values
  const pressed = useSharedValue(0); // 0 = unpressed, 1 = pressed
  const bounce = useSharedValue(1); // For the active "breathing" effect

  // Define colors based on state
  const colors = isLocked
    ? COLORS.locked
    : isCompleted
      ? COLORS.completed
      : COLORS.active;

  useEffect(() => {
    if (isActive) {
      // Subtle breathing animation for current level
      bounce.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [isActive]);

  const animatedFaceStyle = useAnimatedStyle(() => {
    // Determine how much to move down based on press state
    const translateY = interpolate(
      pressed.value,
      [0, 1],
      [0, BUTTON_SHADOW_HEIGHT]
    );

    return {
      transform: [
        { translateY },
        { scale: isActive ? bounce.value : 1 }, // Apply breathing only if active
      ],
    };
  });

  const handlePressIn = () => {
    if (isLocked) return;
    pressed.value = withSpring(1, { damping: 15 });
  };

  const handlePressOut = () => {
    if (isLocked) return;
    pressed.value = withSpring(0, { damping: 15 });
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: x - NODE_SIZE / 2,
        top: y - BUTTON_HEIGHT / 2,
        width: NODE_SIZE,
        height: BUTTON_HEIGHT + BUTTON_SHADOW_HEIGHT,
        alignItems: 'center',
      }}
    >
      {/* Floating Label for Active Level */}
      {isActive && (
        <Animated.View
          style={[styles.floatingLabel, { transform: [{ translateY: -10 }] }]}
        >
          <Text style={styles.floatingLabelText}>START</Text>
          <View style={styles.triangle} />
        </Animated.View>
      )}

      {/* The Button Structure */}
      <Pressable
        onPress={() => !isLocked && onPress(level.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ width: '100%', height: '100%' }}
      >
        {/* SHADOW LAYER (The bottom part that stays still) */}
        <View
          style={[
            styles.buttonShadow,
            {
              backgroundColor: colors.shadow,
              top: BUTTON_SHADOW_HEIGHT, // Push it down
            },
          ]}
        />

        {/* FACE LAYER (The top part that moves) */}
        <Animated.View
          style={[
            styles.buttonFace,
            {
              backgroundColor: colors.face,
            },
            animatedFaceStyle,
          ]}
        >
          {isActive ? (
            // Active Icon (e.g., The Orca)
            <Image
              source={require('@/assets/images/icon.png')} // Update path
              style={{ width: 45, height: 45 }}
              contentFit='contain'
            />
          ) : isCompleted ? (
            // Checkmark for completed
            <Text style={{ fontSize: 32 }}>✓</Text>
          ) : (
            // Number for locked
            <Text style={{ fontSize: 24, fontWeight: '700' }}>
              {level.order}
            </Text>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
};

// --- MAIN SCREEN ---
export const LevelMap = () => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const scrollY = useSharedValue(0);

  // Calculation logic
  const totalHeight = LEVELS.length * VERTICAL_SPACING + 400; // Extra padding at bottom
  const centerX = SCREEN_WIDTH / 2;

  const levelCoords = useMemo(() => {
    return LEVELS.map((level, index) => {
      // Invert Y so level 1 is at the bottom
      const y = totalHeight - (index * VERTICAL_SPACING + 200);
      // Sine wave for X
      const x = centerX + Math.sin(index * 0.55) * AMPLITUDE;
      return { ...level, x, y };
    });
  }, [totalHeight]);

  const handleLevelPress = (id: number) => {
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

  const [streak, setStreak] = useState(7); // example
  const [lastActive, setLastActive] = useState('2025-12-10');

  // Helper: returns a YYYY-MM-DD string
  const getToday = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    const today = getToday();

    if (lastActive === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActive === yesterdayStr) {
      // continue streak
      setStreak((prev) => prev + 1);
    } else {
      // streak broken
      setStreak(0);
    }

    setLastActive(today);
  }, []);

  const firePulse = useSharedValue(1);

  useEffect(() => {
    firePulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 900 }),
        withTiming(1, { duration: 900 })
      ),
      -1,
      true
    );
  }, []);

  return (
    <OceanBackground>
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
          <SquishyLevelNode
            key={level.id}
            level={level}
            x={level.x}
            y={level.y}
            onPress={handleLevelPress}
          />
        ))}
      </Animated.ScrollView>

      <LinearGradient
        colors={[
          'rgba(255,255,255,1)',
          'rgba(255,255,255,0.5)',
          'rgba(255,255,255,0.01)',
        ]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 200,
        }}
      />

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#000',
          paddingHorizontal: 16,
          paddingTop: 32,
          paddingBottom: insets.bottom + 16,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          gap: 20,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Image
              source={require('@/assets/images/orca.png')} // Update path
              style={{ width: 42, height: 42, borderRadius: 16 }}
              contentFit='contain'
            />
            <Text variant='heading' style={{ color: '#FFF', fontSize: 32 }}>
              Orca
            </Text>
          </View>

          <View style={{ marginRight: 10 }}>
            <Avatar size={40}>
              <AvatarImage
                source={{
                  uri: 'https://avatars.githubusercontent.com/u/99088394?v=4',
                }}
              />
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
          </View>
        </View>

        {/* --- STREAK SECTION --- */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View
            style={[
              {
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: 'rgba(255,140,0,0.15)',
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
          >
            <Feather name='zap' size={32} color='#FFA200' />
          </View>

          <View>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>
              {streak} Day Streak
            </Text>
            <Text style={{ color: '#aaa', fontSize: 14 }}>
              Keep learning daily to grow your streak!
            </Text>
          </View>
        </View>

        {/* Start Button */}
        <Button variant='success'>Start</Button>
      </View>

      {/* <Music /> */}
    </OceanBackground>
  );
};

const styles = StyleSheet.create({
  oceanContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sunRays: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.05)', // Subtle overlay
    zIndex: -1,
  },
  scrollView: {
    flex: 1,
  },
  buttonFace: {
    width: NODE_SIZE,
    height: BUTTON_HEIGHT,
    borderRadius: 999, // Squircle shape
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.05)', // Subtle inner rim
  },
  buttonShadow: {
    position: 'absolute',
    width: NODE_SIZE,
    height: BUTTON_HEIGHT,
    borderRadius: 999,
    zIndex: 1,
  },
  floatingLabel: {
    position: 'absolute',
    top: -40,
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    width: 100,
  },
  floatingLabelText: {
    color: COLORS.background,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
    textAlign: 'center',
  },
  triangle: {
    position: 'absolute',
    bottom: -8,
    left: 50,
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#000',
  },
});
