import React, { useEffect } from 'react';
import { StyleSheet, Platform, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { useColor } from '@/hooks/useColor';
import { ScoreData } from './level';
import { FONT_SIZE } from '@/theme/globals';

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style);
  }
};

// Rank Badge Component
const RankBadge = ({
  rank,
  children,
}: {
  rank: number;
  children: React.ReactNode;
}) => {
  const getBgColor = () => {
    switch (rank) {
      case 1:
        return '#6C63FF';
      case 2:
        return '#4ECDC4';
      case 3:
        return '#FF8C42';
      default:
        return '#FF6B35';
    }
  };

  const isTopThree = rank <= 3;

  return (
    <View style={[styles.rankBadge, { backgroundColor: getBgColor() }]}>
      <Text style={[styles.rankText, { fontSize: isTopThree ? 28 : 20 }]}>
        {children}
      </Text>
    </View>
  );
};

// ScoreCard Component with 3D press effect and haptic
export const ScoreCard = ({
  score,
  onPress,
}: {
  score: ScoreData;
  onPress: () => void;
}) => {
  const yellow = useColor('orca');

  const pressed = useSharedValue(0);
  const sparkle = useSharedValue(0);

  useEffect(() => {
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

  const getEmoji = () => {
    switch (score.rank) {
      case 1:
        return '👑';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${score.rank}`;
    }
  };

  const colors = getRankColor();

  return (
    <Animated.View style={styles.scoreContainer}>
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
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
          pressed.value = withSpring(1, { damping: 16 });
        }}
        onPressOut={() => {
          triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
          pressed.value = withSpring(0, { damping: 16 });
        }}
      >
        <Animated.View
          style={[
            styles.scoreCard,
            { backgroundColor: colors.bg },
            animatedStyle,
          ]}
        >
          <View style={styles.scoreContent}>
            <View style={styles.playerSection}>
              <RankBadge rank={score.rank || 0}>{getEmoji()}</RankBadge>

              <RankBadge rank={score.rank || 0}>
                {score?.image ? (
                  <Image
                    source={{ uri: score?.image }}
                    style={{ width: '100%', height: '100%', borderRadius: 999 }}
                    contentFit='cover'
                  />
                ) : (
                  <Text
                    style={{
                      color: '#FFF',
                      fontSize: FONT_SIZE,
                      fontWeight: '800',
                    }}
                  >
                    {score?.name
                      ?.trim()
                      .split(/\s+/)
                      .map((part) => part[0]?.toUpperCase())
                      .join('')}
                  </Text>
                )}
              </RankBadge>

              <Text variant='title' style={styles.nameText}>
                {score.name}
              </Text>
            </View>

            <View style={styles.timeSection}>
              <View style={styles.timeContainer}>
                <Text
                  variant='title'
                  style={{
                    color: yellow,
                    fontSize: 22,
                    fontWeight: '900',
                  }}
                >
                  {score.time}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
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
    overflow: 'hidden',
  },
  scoreContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 6,
  },
  rankText: {
    fontWeight: '900',
  },
  playerSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nameText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '900',
  },
  timeSection: {
    alignItems: 'center',
    gap: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
