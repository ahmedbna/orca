import { useMemo } from 'react';
import { TouchableOpacity } from 'react-native';
import { Streak } from '@/components/map/streak';
import { OrcaButton } from '@/components/orca-button';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { HeatmapChart } from '@/components/charts/heatmap-chart';
import { ChartContainer } from '@/components/charts/chart-container';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

/* ----------------------------- */
/* Helpers */
/* ----------------------------- */

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function getYearRange(year: number) {
  return {
    start: Date.UTC(year, 0, 1),
    end: Date.UTC(year, 11, 31),
  };
}

/* ----------------------------- */
/* Screen */
/* ----------------------------- */

export default function StreakScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const year = new Date().getFullYear();
  const { start, end } = getYearRange(year);

  const course = useQuery(api.courses.getCourse);
  const streak = useQuery(api.wins.getCurrentStreak);
  const heatmapData = useQuery(api.wins.getWinHeatmap, {
    yearStart: start,
    yearEnd: end,
  });

  if (
    course === undefined ||
    streak === undefined ||
    heatmapData === undefined
  ) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size='lg' variant='circle' color='#000' />
      </View>
    );
  }

  if (course === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Course Not Found!</Text>
      </View>
    );
  }

  const currentLesson = course.lessons.find((l) => l.status === 'active');

  /* ----------------------------- */
  /* Transform Convex → Heatmap */
  /* ----------------------------- */

  const heatmapDataset = useMemo(() => {
    const data: {
      row: string;
      col: string;
      value: number;
    }[] = [];

    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const utcDay = Date.UTC(year, month, day);
        const value = heatmapData[utcDay] ?? 0;

        data.push({
          row: MONTHS[month],
          col: day.toString(),
          value,
        });
      }
    }

    return data;
  }, [heatmapData, year]);

  return (
    <View style={{ flex: 1 }}>
      {/* ---------------- Heatmap ---------------- */}
      <View
        style={{ flex: 1, paddingTop: insets.top + 100, paddingHorizontal: 16 }}
      >
        <ChartContainer
          title='Winning Streak'
          description={`Number of lesson wins per day in ${year}`}
        >
          <HeatmapChart
            data={heatmapDataset}
            config={{
              height: 420,
              showLabels: false,
              animated: true,
              duration: 800,
              padding: 16,
              colorScale: [
                '#F3F4F6', // 0
                '#FDE68A', // 1
                '#FACC15', // 2–3
                '#FB923C', // 4–5
                '#EF4444', // 6+
              ],
            }}
          />
        </ChartContainer>
      </View>

      {/* ---------------- Bottom Sheet ---------------- */}
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
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}
        >
          <ChevronLeft size={26} color='#000' strokeWidth={3} />

          <Text
            variant='title'
            style={{ fontSize: 22, color: '#000', fontWeight: '800' }}
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
