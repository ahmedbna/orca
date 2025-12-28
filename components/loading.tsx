import { Dimensions } from 'react-native';
import { View } from '@/components/ui/view';
import { BubbleLayers, Bubbles } from '@/components/orca/bubbles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const Loading = () => {
  const layers: Array<BubbleLayers> = [
    {
      speed: 150,
      count: 20,
      scale: 0.5,
      baseOpacity: 0.4,
      color: 'white',
      yRange: [0, SCREEN_HEIGHT],
    },
    {
      speed: 180,
      count: 18,
      scale: 0.7,
      baseOpacity: 0.5,
      color: 'white',
      yRange: [0, SCREEN_HEIGHT],
    },
    {
      speed: 200,
      count: 15,
      scale: 0.9,
      baseOpacity: 0.6,
      color: 'white',
      yRange: [0, SCREEN_HEIGHT],
    },
    {
      speed: 220,
      count: 12,
      scale: 1.1,
      baseOpacity: 0.7,
      color: 'white',
      yRange: [0, SCREEN_HEIGHT] as [number, number],
    },
    {
      speed: 250,
      count: 10,
      scale: 1.3,
      baseOpacity: 0.8,
      color: 'white',
      yRange: [0, SCREEN_HEIGHT],
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <Bubbles direction='up' layers={layers} />
    </View>
  );
};
