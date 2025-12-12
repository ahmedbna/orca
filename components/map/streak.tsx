import { Feather } from '@expo/vector-icons';
import { View } from '../ui/view';
import { Text } from '../ui/text';
import { useEffect, useState } from 'react';

export const Streak = () => {
  const [streak, setStreak] = useState(7); // example
  const [lastActive, setLastActive] = useState('2025-12-10');

  // Helper: returns a YYYY-MM-DD string
  const getToday = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    const today = getToday();

    if (lastActive === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActive === yesterdayStr) {
      // continue streak
      setStreak((prev) => prev + 1);
    } else {
      // streak broken
      setStreak(0);
    }

    setLastActive(today);
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <View
        style={[
          {
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: 'rgba(255,140,0,0.15)',
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <Feather name='zap' size={32} color='#FFA200' />
      </View>

      <View>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>
          {streak} Day Streak
        </Text>
        <Text style={{ color: '#aaa', fontSize: 14 }}>
          Keep learning daily to grow your streak!
        </Text>
      </View>
    </View>
  );
};
