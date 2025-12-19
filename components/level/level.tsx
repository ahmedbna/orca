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
import { useColor } from '@/hooks/useColor';
import { Background } from '@/components/background';
import { useRouter } from 'expo-router';
import { Doc } from '@/convex/_generated/dataModel';
import { LANGUAGES } from '@/constants/languages';
import { OrcaButton } from '../orca-button';
import { LessonCard } from './lesson-card';
import { TouchableOpacity } from 'react-native';
import { ScoreCard } from './score-card';

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

type Props = {
  lesson: Doc<'lessons'> & {
    course: Doc<'courses'>;
  };
};

export const Level = ({ lesson }: Props) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hasScores = SCORES.length > 0;

  const handlePlayPress = () => {
    router.push(`/orca/${lesson._id}`);
  };

  return (
    <Background>
      <View
        style={{
          flex: 1,
        }}
      >
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
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyContent]}>
              <Text style={styles.emptyEmoji}>🏆</Text>
              <Text variant='heading' style={styles.emptyTitle}>
                No Champions Yet!
              </Text>
              <Text style={styles.emptyText}>
                Be the first to conquer this level{'\n'}and claim your spot on
                top!
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Action Buttons */}
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
            gap: 8,
            height: insets.bottom + 240,
            overflow: 'visible',
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}
        >
          <Text variant='heading'>
            {
              LANGUAGES.find((lang) => lang.code === lesson.course.language)
                ?.flag
            }
          </Text>
          <Text
            variant='title'
            style={{ fontSize: 22, color: '#000', fontWeight: '800' }}
          >
            {lesson.course.title}
          </Text>
        </TouchableOpacity>

        <LessonCard lesson={lesson} />

        <OrcaButton label='PLAY' variant='green' onPress={handlePlayPress} />
      </View>
    </Background>
  );
};

const styles = StyleSheet.create({
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
});
