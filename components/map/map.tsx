import React, { useMemo, useEffect, useRef } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Jellyfish } from '@/components/orca/jellyfish';
import { Bubbles } from '@/components/orca/bubbles';
import { Clouds } from '@/components/orca/clouds';
import { Shark } from '@/components/orca/shark';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/button';
import { Music } from '../orca/music';
import { Streak } from './streak';
import { SquishyButton } from './squishy-button';
import { Seafloor } from '../orca/seafloor';
import { Seaweed } from '../orca/seaweed';

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
const VERTICAL_SPACING = 100;
const AMPLITUDE = SCREEN_WIDTH * 0.3;

// --- TYPES ---
type LevelStatus = 'locked' | 'active' | 'completed';

export interface LevelData {
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
      <Shark />
      <Jellyfish />
      <Seafloor bottom={300} speed={0} />
      {/* <Seaweed /> */}

      {children}
    </View>
  );
};

// --- MAIN SCREEN ---
export const Map = () => {
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
    <OceanBackground>
      <LinearGradient
        colors={[
          '#FAD40B',
          'rgba(250, 212, 11, 0.5)',
          'rgba(250, 212, 11, 0.01)',
        ]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: insets.top + 120,
          zIndex: 10,
        }}
      />

      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: insets.bottom + 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 99,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={require('@/assets/images/icon.png')} // Update path
            style={{ width: 54, height: 54, borderRadius: 14 }}
            contentFit='contain'
          />
          <Text variant='heading' style={{ color: '#000', fontSize: 32 }}>
            Orca
          </Text>
        </View>

        <Avatar size={42}>
          <AvatarImage
            source={{
              uri: 'https://avatars.githubusercontent.com/u/99088394?v=4',
            }}
          />
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      </View>

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

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#000',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
          gap: 16,
          height: 300,
        }}
      >
        <Streak />

        <Button variant='success'>START</Button>
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
  scrollView: {
    flex: 1,
  },
  buttonFace: {
    width: NODE_SIZE,
    height: BUTTON_HEIGHT,
    borderRadius: 999,
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
