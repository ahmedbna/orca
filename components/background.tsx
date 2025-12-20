import { Jellyfish } from '@/components/orca/jellyfish';
import { Bubbles } from '@/components/orca/bubbles';
import { Clouds } from '@/components/orca/clouds';
import { Shark } from '@/components/orca/shark';
import { Seafloor } from '@/components/orca/seafloor';
import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export const Background = ({
  swim,
  children,
}: {
  swim?: boolean;
  children: React.ReactNode;
}) => {
  const yellow = useColor('orca');
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: yellow,
      }}
    >
      <LinearGradient
        colors={[
          '#FAD40B',
          'rgba(250, 212, 11, 0.5)',
          'rgba(250, 212, 11, 0.01)',
        ]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: insets.top + 120,
          zIndex: 10,
        }}
      />

      <Pressable
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: insets.bottom + 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20,
        }}
        onPress={() => {
          if (!router.canDismiss()) return;
          router.dismissAll();
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={require('@/assets/images/icon.png')}
            style={{ width: 54, height: 54, borderRadius: 14 }}
            contentFit='contain'
          />
          <Text variant='heading' style={{ color: '#000', fontSize: 32 }}>
            Orca
          </Text>
        </View>

        <Avatar size={42}>
          <AvatarImage
            source={{
              uri: 'https://avatars.githubusercontent.com/u/99088394?v=4',
            }}
          />
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      </Pressable>

      <Clouds />
      <Bubbles />
      <Shark />
      <Jellyfish />
      <Seafloor speed={swim ? 5000 : 0} bottom={insets.bottom + 240} />

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
      />
      {children}
    </View>
  );
};
