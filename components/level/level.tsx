import { FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { LANGUAGES } from '@/constants/languages';
import { OrcaButton } from '../orca-button';
import { LessonCard } from './lesson-card';
import { TouchableOpacity } from 'react-native';
import { ScoreCard } from './score-card';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Spinner } from '@/components/ui/spinner';
import { formatTime } from '@/lib/format-time';
import { ChevronLeft } from 'lucide-react-native';

export interface ScoreData {
  userId: Id<'users'>;
  time: string;
  name: string;
  image: string | null;
  rank: number;
}

type Props = {
  lesson: Doc<'lessons'> & {
    course: Doc<'courses'>;
  };
};

export const Level = ({ lesson }: Props) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Fetch leaderboard data
  const leaderboard = useQuery(api.scores.getLeaderboard, {
    lessonId: lesson._id,
  });

  const handlePlayPress = () => {
    router.push(`/(home)/orca/${lesson._id}`);
  };

  // Show loading state
  if (leaderboard === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Spinner size='lg' variant='circle' color='#000000' />
      </View>
    );
  }

  // Transform leaderboard data to match ScoreData interface
  const scores: ScoreData[] =
    leaderboard?.map((entry) => ({
      userId: entry.userId,
      time: formatTime(entry.time), // Convert ms to seconds
      name: entry.name,
      image: entry.image,
      rank: entry.rank,
    })) || [];

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={scores}
        renderItem={({ item }) => (
          <ScoreCard
            score={item}
            onPress={() => router.push(`/(home)/student/${item.userId}`)}
          />
        )}
        keyExtractor={(item) => item.userId}
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
        ListEmptyComponent={() => (
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
      />

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
          <ChevronLeft size={26} color='#000' strokeWidth={3} />

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
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  emptyContent: {
    width: '100%',
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
