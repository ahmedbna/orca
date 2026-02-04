import { Courses } from '@/components/courses';
import { OrcaButton } from '@/components/squishy/orca-button';
import { SquishyCard } from '@/components/squishy/squishy-card';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { api } from '@/convex/_generated/api';
import { useSubscription } from '@/hooks/useSubscription';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CoursesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const hasAccess = useQuery(api.subscriptions.hasAccess);
  const { presentPaywall } = useSubscription();

  if (hasAccess === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size='lg' variant='circle' color='#FAD40B' />
      </View>
    );
  }

  const handleCardPress = async () => {
    if (!hasAccess) {
      const purchased = await presentPaywall();

      if (purchased) {
        console.log('User purchased subscription!');
        // The subscription hook will handle backend sync
        // User can now navigate to the course
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAD40B' }}>
      <Courses />

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
            gap: 12,
            height: insets.bottom + 240,
            overflow: 'hidden',
            zIndex: 99,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}
        >
          <ChevronLeft size={26} color='#000' strokeWidth={3} />
          <Text
            variant='title'
            style={{
              fontSize: 22,
              color: '#000',
              fontWeight: '800',
              opacity: 0.7,
            }}
          >
            Back
          </Text>
        </TouchableOpacity>

        <SquishyCard>
          {hasAccess ? (
            <View>
              <Text variant='title'>Orca+ 👑</Text>
              <Text
                variant='caption'
                style={{ fontWeight: '600', marginTop: 2 }}
              >
                Dive into any course and practice with your AI teacher
              </Text>
            </View>
          ) : (
            <View>
              <Text variant='title'>Go Beyond Free 👑</Text>
              <Text
                variant='caption'
                style={{ fontWeight: '600', marginTop: 2 }}
              >
                Upgrade to Orca+ to unlock all courses and get unlimited AI
              </Text>
            </View>
          )}
        </SquishyCard>

        {hasAccess ? (
          <OrcaButton label='Orca+' variant='green' onPress={() => {}} />
        ) : (
          <OrcaButton label='Orca+' variant='red' onPress={handleCardPress} />
        )}
      </View>
    </View>
  );
}
