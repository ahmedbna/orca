import React, { useMemo, useEffect, useRef } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Jellyfish } from '@/components/orca/jellyfish';
import { Bubbles } from '@/components/orca/bubbles';
import { Clouds } from '@/components/orca/clouds';
import { Shark } from '@/components/orca/shark';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/button';
import { Music } from '../orca/music';
import { Seafloor } from '../orca/seafloor';

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

export interface ScoreData {
  id: number;
  time: number;
  name: string;
  image: string;
}

// --- MOCK DATA ---
const SCORES: ScoreData[] = [
  {
    id: 1,
    time: 10,
    name: 'Ahmed',
    image: 'https://avatars.githubusercontent.com/u/99088394?v=4',
  },
  {
    id: 2,
    time: 10,
    name: 'Ahmed',
    image: 'https://avatars.githubusercontent.com/u/99088394?v=4',
  },
  {
    id: 3,
    time: 10,
    name: 'Ahmed',
    image: 'https://avatars.githubusercontent.com/u/99088394?v=4',
  },
];

const OceanBackground = ({ children }: { children: React.ReactNode }) => {
  return (
    <View style={styles.oceanContainer}>
      <Clouds />
      <Bubbles />
      <Shark />
      <Jellyfish />
      <Seafloor speed={0} />
      {/* <Seaweed /> */}

      {children}
    </View>
  );
};

// --- MAIN SCREEN ---
export const Level = () => {
  const insets = useSafeAreaInsets();

  return (
    <OceanBackground>
      <LinearGradient
        colors={['#FAD40B', '#FAD40B50', 'rgba(255,255,255,0.01)']}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: insets.top + 100,
          zIndex: 99,
        }}
      />

      <View>
        <FlatList
          data={SCORES}
          renderItem={({ item }) => <Score score={item} />}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            gap: 8,
            padding: 32,
            paddingTop: insets.top + 100,
          }}
        />
      </View>

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
          height: 220,
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
            <Text variant='heading' style={{ color: '#FFF', fontSize: 32 }}>
              Orca
            </Text>
            {/* <Image
              source={require('@/assets/images/icon.png')} // Update path
              style={{ width: 48, height: 48, borderRadius: 14 }}
              contentFit='contain'
            /> */}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Pressable
            style={{
              backgroundColor: COLORS.background,
              height: 100,
              flex: 1,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant='title' style={{ color: '#000' }}>
              STUDY
            </Text>
          </Pressable>
          <Pressable
            style={{
              backgroundColor: COLORS.completed.face,
              height: 100,
              flex: 1,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant='title'>PLAY</Text>
          </Pressable>
        </View>
      </View>

      {/* <Music /> */}
    </OceanBackground>
  );
};

type ScoreProps = {
  score: ScoreData;
};

const Score = ({ score }: ScoreProps) => {
  return (
    <TouchableOpacity
      style={{ padding: 16, backgroundColor: '#000', borderRadius: 999 }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Avatar size={46}>
            <AvatarImage
              source={{
                uri: score.image,
              }}
            />
            <AvatarFallback>AB</AvatarFallback>
          </Avatar>

          <Text variant='title'>{score.name}</Text>
        </View>
        <Text variant='title' style={{ color: '#FAD40B' }}>
          {score.time}
        </Text>
      </View>
    </TouchableOpacity>
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
