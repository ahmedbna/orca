import React, { useMemo, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Text } from '@/components/ui/text';

const WEEKDAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

type Props = {
  year: number;
  month: number; // 0–11
  data: Record<number, number>; // UTC timestamp → value
};

const COLORS = [
  '#FDE68A', // 0 – very light mint (low / empty)
  '#4ADE80', // 1 – vibrant green
  '#22C55E', // 2–3 – strong emerald
  '#166534', // 4+ – deep forest green
];

function getColor(value: number) {
  if (value <= 0) return COLORS[0];
  if (value === 1) return COLORS[1];
  if (value <= 3) return COLORS[2];
  return COLORS[3];
}

export function HeatmapChart({ year, month, data }: Props) {
  const [width, setWidth] = useState(0);

  /**
   * Matrix: weeks (rows) × days (columns)
   * Saturday = 0
   */
  const matrix = useMemo(() => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    const weeks: number[][] = [];
    let week = Array(7).fill(-1);

    let dayIndex = (start.getDay() + 1) % 7;

    for (let day = 1; day <= end.getDate(); day++) {
      const utc = Date.UTC(year, month, day);
      week[dayIndex] = data[utc] ?? 0;

      dayIndex++;

      if (dayIndex === 7) {
        weeks.push(week);
        week = Array(7).fill(-1);
        dayIndex = 0;
      }
    }

    if (week.some((d) => d !== -1)) {
      weeks.push(week);
    }

    return weeks;
  }, [year, month, data]);

  const cellSize = width > 0 ? width / 7 - 6 : 0;

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  return (
    <View onLayout={onLayout} style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.dayLabel}>
            {day}
          </Text>
        ))}
      </View>

      {/* Grid */}
      {matrix.map((week, rowIndex) => (
        <View key={rowIndex} style={styles.weekRow}>
          {week.map((value, colIndex) => (
            <View
              key={colIndex}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  backgroundColor:
                    value === -1 ? 'transparent' : getColor(value),
                },
              ]}
            >
              {value > 0 && <Text style={styles.cellText}>{value}</Text>}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  weekRow: {
    flexDirection: 'row',
    gap: 6,
  },
  cell: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
  },
});
