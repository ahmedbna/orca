import React, { useEffect } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  interpolate,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Background } from '@/components/background';
import { useColor } from '@/hooks/useColor';

// --- THEME CONSTANTS ---
const COLORS = {
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
const LESSON_SHADOW_HEIGHT = 6;

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

// Lesson Component with 3D effect
const LessonCard = ({ onPress }: { onPress: () => void }) => {
  const pressed = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.01, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedFaceStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      pressed.value,
      [0, 1],
      [0, LESSON_SHADOW_HEIGHT]
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
    <Animated.View style={styles.lessonCard}>
      {/* Shadow */}
      <View style={styles.lessonShadow} />

      {/* Face */}
      <Animated.View
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        style={[styles.lessonFace, animatedFaceStyle]}
      >
        <View style={styles.lessonContent}>
          {/* Lesson Number - Fills height */}
          <View style={styles.lessonNumberContainer}>
            <Text style={styles.lessonNumber}>01</Text>
          </View>

          <Text style={styles.lessonTitle}>
            Wiederholung: Begrüßung und Befinden
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
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
    </View>
  );
};

// ScoreCard Component with 3D effect
const ScoreCard = ({ score }: { score: ScoreData }) => {
  const yellow = useColor('orca');

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

          {/* Time ScoreCard */}
          <View style={styles.timeSection}>
            <View style={styles.timeContainer}>
              <Text style={styles.timeEmoji}>⚡</Text>
              <Text
                variant='title'
                style={{
                  color: yellow,
                  fontSize: 24,
                  fontWeight: '900',
                }}
              >
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

  const handleLessonPress = () => {
    console.log('Lesson card pressed!');
    // Add your navigation or action here
  };

  const handleStudyPress = () => {
    console.log('Study button pressed!');
    // Add your navigation or action here
  };

  const handlePlayPress = () => {
    console.log('Play button pressed!');
    // Add your navigation or action here
  };

  return (
    <Background>
      <View style={styles.content}>
        {hasScores ? (
          <FlatList
            data={SCORES}
            renderItem={({ item }) => <ScoreCard score={item} />}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              gap: 4,
              padding: 20,
              paddingTop: insets.top + 60,
              paddingBottom: 400,
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
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom }]}>
        <LessonCard onPress={handleLessonPress} />

        <View style={styles.buttonRow}>
          <Button3D label='STUDY' variant='yellow' onPress={handleStudyPress} />
          <View style={{ width: 16 }} />
          <Button3D label='PLAY' variant='green' onPress={handlePlayPress} />
        </View>
      </View>
    </Background>
  );
};

const styles = StyleSheet.create({
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

  timeLabel: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.6,
  },
  buttonRow: {
    flexDirection: 'row',
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
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFE17B',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
    height: 300,
    overflow: 'visible',
  },
  lessonCard: {
    height: 150,
    position: 'relative',
  },
  lessonShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: LESSON_SHADOW_HEIGHT,
    height: 140,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    zIndex: 1,
  },
  lessonFace: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 140,
    backgroundColor: '#000',
    borderRadius: 20,
    padding: 16,
    zIndex: 2,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  lessonContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
  },
  lessonNumberContainer: {
    backgroundColor: '#FAD40B',
    borderRadius: 16,
    paddingHorizontal: 16,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  lessonNumber: {
    color: '#000',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 2,
  },

  lessonTitle: {
    flex: 1,
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
