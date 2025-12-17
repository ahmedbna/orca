import React, { useEffect } from 'react';
import { Dimensions, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Jellyfish } from '@/components/orca/jellyfish';
import { Bubbles } from '@/components/orca/bubbles';
import { Clouds } from '@/components/orca/clouds';
import { Shark } from '@/components/orca/shark';
import { LinearGradient } from 'expo-linear-gradient';
import { Seafloor } from '../orca/seafloor';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  interpolate,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- THEME CONSTANTS ---
const COLORS = {
  background: '#FAD40B',
  locked: {
    face: '#E5E7EB',
    shadow: '#AFB2B7',
  },
  active: {
    face: '#FFFFFF',
    shadow: '#D1D5DB',
  },
  completed: {
    face: '#34C759',
    shadow: '#46A302',
  },
  yellow: {
    face: '#FAD40B',
    shadow: '#E5C000',
  },
};

const BUTTON_SHADOW_HEIGHT = 8;

// --- TYPES ---
export interface ScoreData {
  id: number;
  time: number;
  name: string;
  image: string;
  rank?: number;
}

// --- MOCK DATA ---
const SCORES: ScoreData[] = [
  {
    id: 1,
    time: 10,
    name: 'Ahmed',
    image: 'https://avatars.githubusercontent.com/u/99088394?v=4',
    rank: 1,
  },
  {
    id: 2,
    time: 15,
    name: 'Sarah',
    image: 'https://avatars.githubusercontent.com/u/99088394?v=4',
    rank: 2,
  },
  {
    id: 3,
    time: 18,
    name: 'Mohamed',
    image: 'https://avatars.githubusercontent.com/u/99088394?v=4',
    rank: 3,
  },
  {
    id: 4,
    time: 20,
    name: 'Mohamed',
    image: 'https://avatars.githubusercontent.com/u/99088394?v=4',
    rank: 4,
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
      {children}
    </View>
  );
};

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

  const colors = variant === 'yellow' ? COLORS.yellow : COLORS.completed;

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
    <Animated.View style={{ flex: 1, height: 100 }}>
      {/* Shadow */}
      <View
        style={[
          styles.buttonShadow,
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
          styles.buttonFace,
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

// Empty State Component
const EmptyState = () => {
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  return (
    <View style={styles.emptyContainer}>
      <Animated.View style={[styles.emptyContent, animatedStyle]}>
        <Text style={styles.emptyEmoji}>🏆</Text>
        <Text variant='heading' style={styles.emptyTitle}>
          No Champions Yet!
        </Text>
        <Text style={styles.emptyText}>
          Be the first to conquer this level{'\n'}and claim your spot on top!
        </Text>
      </Animated.View>
    </View>
  );
};

// Rank Badge Component
const RankBadge = ({ rank }: { rank: number }) => {
  const getEmoji = () => {
    switch (rank) {
      case 1:
        return '👑';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getBgColor = () => {
    switch (rank) {
      case 1:
        return '#FF6B35';
      case 2:
        return '#4ECDC4';
      case 3:
        return '#FF8C42';
      default:
        return '#6C63FF';
    }
  };

  const isTopThree = rank <= 3;

  return (
    <View style={[styles.rankBadge, { backgroundColor: getBgColor() }]}>
      <Text style={[styles.rankText, { fontSize: isTopThree ? 28 : 20 }]}>
        {getEmoji()}
      </Text>
      {!isTopThree && (
        <View style={styles.rankNumber}>
          <Text style={styles.rankNumberText}>{rank}</Text>
        </View>
      )}
    </View>
  );
};

// Score Card Component with 3D effect
const Score = ({ score }: { score: ScoreData }) => {
  const pressed = useSharedValue(0);
  const sparkle = useSharedValue(0);

  useEffect(() => {
    // Sparkle animation for top 3
    if (score.rank && score.rank <= 3) {
      sparkle.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [score.rank]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(pressed.value, [0, 1], [0, 6]);
    return {
      transform: [{ translateY }],
    };
  });

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkle.value,
  }));

  const handlePressIn = () => {
    pressed.value = withSpring(1, { damping: 15 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 15 });
  };

  const getRankColor = () => {
    switch (score.rank) {
      case 1:
        return { bg: '#FFD700', shadow: '#DAA520' };
      case 2:
        return { bg: '#E8E8E8', shadow: '#B0B0B0' };
      case 3:
        return { bg: '#CD7F32', shadow: '#8B5A2B' };
      default:
        return { bg: '#FFFFFF', shadow: '#D1D5DB' };
    }
  };

  const colors = getRankColor();

  return (
    <Animated.View style={styles.scoreContainer}>
      {/* Sparkle effect for top 3 */}
      {score.rank && score.rank <= 3 && (
        <>
          <Animated.Text
            style={[styles.sparkle, { left: 10, top: 10 }, sparkleStyle]}
          >
            ✨
          </Animated.Text>
          <Animated.Text
            style={[styles.sparkle, { right: 10, top: 10 }, sparkleStyle]}
          >
            ✨
          </Animated.Text>
        </>
      )}

      {/* Shadow layer */}
      <View
        style={[
          styles.scoreShadow,
          {
            backgroundColor: colors.shadow,
            top: 8,
          },
        ]}
      />

      {/* Main card */}
      <Animated.View
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        style={[
          styles.scoreCard,
          {
            backgroundColor: colors.bg,
          },
          animatedStyle,
        ]}
      >
        <View style={styles.scoreContent}>
          {/* Rank Badge - Large and prominent */}
          <View style={styles.rankSection}>
            <RankBadge rank={score.rank || 0} />
          </View>

          {/* Player Info */}
          <View style={styles.playerSection}>
            <View style={styles.avatarRing}>
              <Avatar size={56}>
                <AvatarImage source={{ uri: score.image }} />
                <AvatarFallback>
                  <Text style={{ fontSize: 24, fontWeight: '900' }}>
                    {score.name.charAt(0).toUpperCase()}
                  </Text>
                </AvatarFallback>
              </Avatar>
            </View>
            <View style={styles.playerInfo}>
              <Text variant='title' style={styles.nameText}>
                {score.name}
              </Text>
              <View style={styles.statsBadge}>
                <Text style={styles.statsEmoji}>🎯</Text>
                <Text style={styles.statsText}>Level Master</Text>
              </View>
            </View>
          </View>

          {/* Time Score */}
          <View style={styles.timeSection}>
            <View style={styles.timeContainer}>
              <Text style={styles.timeEmoji}>⚡</Text>
              <Text variant='title' style={styles.timeText}>
                {score.time}
              </Text>
            </View>
            <Text style={styles.timeLabel}>seconds</Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

// --- MAIN SCREEN ---
export const Level = () => {
  const insets = useSafeAreaInsets();
  const hasScores = SCORES.length > 0;

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

      <View style={styles.content}>
        {hasScores ? (
          <FlatList
            data={SCORES}
            renderItem={({ item }) => <Score score={item} />}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              gap: 8,
              padding: 20,
              paddingTop: insets.top + 80,
              paddingBottom: 240,
            }}
            ListHeaderComponent={() => (
              <View>
                <Text
                  variant='heading'
                  style={{
                    color: '#000',
                    textShadowColor: 'rgba(255, 255, 255, 0.5)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 4,
                  }}
                >
                  🏆 Leaderboard
                </Text>
              </View>
            )}
          />
        ) : (
          <EmptyState />
        )}
      </View>

      {/* Bottom Action Buttons */}
      <View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#000',
            paddingHorizontal: 16,
            paddingTop: 16,
            gap: 16,
            height: 220,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <View style={{ gap: 8 }}>
          <Text variant='heading' style={{ color: '#fff' }}>
            Lesson 1: Hello
          </Text>
          <Text variant='caption'>Lesson 1: Hello</Text>
        </View>

        <View style={styles.buttonRow}>
          <Button3D label='STUDY' variant='yellow' onPress={() => {}} />
          <View style={{ width: 16 }} />
          <Button3D label='PLAY' variant='green' onPress={() => {}} />
        </View>
      </View>
    </OceanBackground>
  );
};

const styles = StyleSheet.create({
  oceanContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 40,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#000',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  scoreContainer: {
    position: 'relative',
    height: 110,
    marginBottom: 4,
  },
  scoreShadow: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: 0,
    height: 100,
    borderRadius: 28,
  },
  scoreCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 100,
    borderRadius: 28,
    borderWidth: 5,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    overflow: 'visible',
  },
  scoreContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 20,
    zIndex: 10,
  },
  rankSection: {
    marginRight: 12,
  },
  rankBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  rankText: {
    fontWeight: '900',
  },
  rankNumber: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#000',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  rankNumberText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  playerSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  playerInfo: {
    flex: 1,
    gap: 4,
  },
  nameText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '900',
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statsEmoji: {
    fontSize: 12,
  },
  statsText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.8,
  },
  timeSection: {
    alignItems: 'center',
    gap: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  timeEmoji: {
    fontSize: 18,
  },
  timeText: {
    color: COLORS.background,
    fontSize: 24,
    fontWeight: '900',
  },
  timeLabel: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  buttonFace: {
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
  buttonShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 92,
    borderRadius: 24,
    zIndex: 1,
  },
});
