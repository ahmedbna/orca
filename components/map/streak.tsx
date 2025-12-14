import { useMemo, useState } from 'react';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const TOTAL_DAYS = 7;

// Vibrant left → right streak gradient
const STREAK_GRADIENT = [
  '#FFD000', // yellow
  '#FFA200', // orange
  '#FF7A18', // deep orange
  '#FF4D4D', // coral
  '#FF2D87', // pink
  '#B44CFF', // purple
  '#6C4CFF', // violet
] as const;

export const Streak = () => {
  const [streak, setStreak] = useState(6);
  const [lastActive, setLastActive] = useState('2025-12-10');

  const getToday = () => new Date().toISOString().split('T')[0];

  // useEffect(() => {
  //   const today = getToday();
  //   if (lastActive === today) return;

  //   const yesterday = new Date();
  //   yesterday.setDate(yesterday.getDate() - 1);
  //   const yesterdayStr = yesterday.toISOString().split('T')[0];

  //   if (lastActive === yesterdayStr) {
  //     setStreak((prev) => prev + 1);
  //   } else {
  //     setStreak(1);
  //   }

  //   setLastActive(today);
  // }, []);

  return (
    <TouchableOpacity
      style={{
        gap: 8,
        paddingHorizontal: 8,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>
              {streak} Day Streak
            </Text>
            <Text style={{ color: '#aaa', fontSize: 14 }}>
              Learn every day to keep it alive
            </Text>
          </View>
        </View>

        <ChevronRight size={32} color='#aaa' />
      </View>

      {/* Gradient Streak Days */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        {Array.from({ length: TOTAL_DAYS }).map((_, index) => (
          <StreakDay key={index} index={index} active={index < streak} />
        ))}
      </View>
    </TouchableOpacity>
  );
};

interface StreakDayProps {
  index: number;
  active: boolean;
}

function StreakDay({ index, active }: StreakDayProps) {
  // Each circle gets its slice of the gradient
  const gradientSlice = useMemo(
    () =>
      [
        STREAK_GRADIENT[index],
        STREAK_GRADIENT[Math.min(index + 1, STREAK_GRADIENT.length - 1)],
      ] as const,
    [index]
  );

  return (
    <View
      style={[
        {
          width: 48,
          height: 48,
          borderRadius: 999,
          overflow: 'hidden',
          backgroundColor: '#444',
        },
      ]}
    >
      {active ? (
        <LinearGradient
          colors={gradientSlice}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: '#000',
              fontWeight: '900',
              fontSize: 14,
            }}
          >
            {index + 1}
          </Text>
        </LinearGradient>
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#777', fontWeight: '700' }}>{index + 1}</Text>
        </View>
      )}
    </View>
  );
}
