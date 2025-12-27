import { useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Doc } from '@/convex/_generated/dataModel';
import { Image } from 'expo-image';

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

function getYearRange(year: number) {
  return {
    start: Date.UTC(year, 0, 1),
    end: Date.UTC(year, 11, 31),
  };
}

type Props = {
  user: Doc<'users'>;
};

export const Profile = ({ user }: Props) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const course = useQuery(api.courses.getCourse);
  const streak = useQuery(api.wins.getCurrentStreak);

  if (course === undefined || streak === undefined) {
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

  const AVATAR_SHADOW_OFFSET = 6;
  const size = 120;
  const colors = {
    face: '#5E5CE6',
    shadow: '#3F3DB8',
    text: '#FFFFFF',
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
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            marginBottom: 16,
            gap: 16,
          }}
        >
          <View>
            <View
              pointerEvents='none'
              style={{
                top: AVATAR_SHADOW_OFFSET,
                left: 0,
                width: size,
                height: size,
                borderRadius: 26,
                backgroundColor: colors.shadow,
              }}
            />

            {/* Face (true circle) */}
            <View
              pointerEvents='none'
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: size,
                  height: size,
                  borderRadius: 26,
                  backgroundColor: colors.face,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderWidth: 3,
                  borderColor: 'rgba(0,0,0,0.15)',
                },
              ]}
            >
              {user.image ? (
                <Image
                  source={{ uri: user.image }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit='cover'
                />
              ) : (
                <Text
                  style={{
                    color: '#FFF',
                    fontSize: 32,
                    fontWeight: '800',
                  }}
                >
                  {user.name
                    ?.split(' ')
                    .map((part) => part.charAt(0).toUpperCase())
                    .join('')}
                </Text>
              )}
            </View>
          </View>
          <Text
            variant='heading'
            style={{
              color: '#000',
              textShadowColor: 'rgba(255, 255, 255, 0.5)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
              fontWeight: 900,
              fontSize: 32,
            }}
          >
            {user.name}
          </Text>
        </View>
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
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}
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
          label={`SETTIGS`}
          variant='gray'
          onPress={() => currentLesson && router.push(`/settings`)}
        />
      </View>
    </View>
  );
};
