// app/(home)/streak.tsx
import { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Streak } from '@/components/map/streak';
import { OrcaButton } from '@/components/squishy/orca-button';
import { Loading } from '@/components/loading';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { HeatmapChart } from '@/components/charts/heatmap-chart';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function StreakScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const today = new Date();
  const year = today.getFullYear();

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const course = useQuery(api.courses.getCourse);
  const streak = useQuery(api.completions.getCurrentStreak);
  const heatmapData = useQuery(api.completions.getWinHeatmap);

  if (
    course === undefined ||
    streak === undefined ||
    heatmapData === undefined
  ) {
    return <Loading />;
  }

  if (course === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Course Not Found!</Text>
      </View>
    );
  }

  const currentLesson = course.lessons.find((l) => l.status === 'active');

  const goPrevMonth = () => {
    setCurrentMonth((m) => Math.max(0, m - 1));
  };

  const goNextMonth = () => {
    setCurrentMonth((m) => Math.min(11, m + 1));
  };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 80,
          paddingHorizontal: 16,
        }}
      >
        <View style={{ marginBottom: 16 }}>
          <Text
            variant='heading'
            style={{
              color: '#000',
              textShadowColor: 'rgba(255, 255, 255, 0.5)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
            }}
          >
            🏆 Winning Streak
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginVertical: 12,
          }}
        >
          <TouchableOpacity
            onPress={goPrevMonth}
            disabled={currentMonth === 0}
            style={{ opacity: currentMonth === 0 ? 0.3 : 1 }}
          >
            <ChevronLeft size={28} color='#000' strokeWidth={3} />
          </TouchableOpacity>

          <Text variant='title' style={{ fontWeight: '700', color: '#000' }}>
            {MONTHS[currentMonth]} {year}
          </Text>

          <TouchableOpacity
            onPress={goNextMonth}
            disabled={currentMonth === 11}
            style={{ opacity: currentMonth === 11 ? 0.3 : 1 }}
          >
            <ChevronRight size={28} color='#000' strokeWidth={3} />
          </TouchableOpacity>
        </View>

        <HeatmapChart year={year} month={currentMonth} data={heatmapData} />
      </View>

      <View
        style={{
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
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}
        >
          <ChevronLeft size={26} color='#000' strokeWidth={3} opacity={0.7} />
          <Text
            variant='title'
            style={{
              fontSize: 22,
              color: '#000',
              fontWeight: 800,
              opacity: 0.7,
            }}
          >
            Back
          </Text>
        </TouchableOpacity>

        <Streak streak={streak} />

        <OrcaButton
          label={`START (${currentLesson ? currentLesson.order : ''})`}
          variant='green'
          onPress={() =>
            currentLesson && router.push(`/(home)/level/${currentLesson._id}`)
          }
        />
      </View>
    </View>
  );
}
