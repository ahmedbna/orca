import { Dimensions } from 'react-native';
import { View } from '@/components/ui/view';
import { Seafloor } from '@/components/orca/seafloor';
import { BubbleLayers, Bubbles } from '@/components/orca/bubbles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const Loading = () => {
  const insets = useSafeAreaInsets();

  const layers: Array<BubbleLayers> = [
    {
      speed: 150,
      count: 40,
      scale: 0.5,
      baseOpacity: 0.4,
      color: 'white',
      yRange: [0, SCREEN_HEIGHT],
    },
    {
      speed: 180,
      count: 38,
      scale: 0.7,
      baseOpacity: 0.5,
      color: 'white',
      yRange: [0, SCREEN_HEIGHT],
    },
    {
      speed: 200,
      count: 33,
      scale: 0.9,
      baseOpacity: 0.6,
      color: 'white',
      yRange: [0, SCREEN_HEIGHT],
    },
    {
      speed: 220,
      count: 32,
      scale: 1.1,
      baseOpacity: 0.7,
      color: 'white',
      yRange: [0, SCREEN_HEIGHT] as [number, number],
    },
    {
      speed: 250,
      count: 30,
      scale: 1.3,
      baseOpacity: 0.8,
      color: 'white',
      yRange: [0, SCREEN_HEIGHT],
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <Bubbles direction='up' layers={layers} />

      <View
        style={{
          paddingBottom: insets.bottom,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#F6C90E',
          paddingHorizontal: 16,
          height: insets.bottom + 240,
          zIndex: 99,
        }}
      />
    </View>
  );
};
