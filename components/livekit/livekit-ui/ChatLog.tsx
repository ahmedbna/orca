import {
  ReceivedMessage,
  useLocalParticipant,
} from '@livekit/components-react';
import { Image } from 'expo-image';
import { useCallback } from 'react';
import {
  ListRenderItemInfo,
  StyleProp,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

export type ChatLogProps = {
  style: StyleProp<ViewStyle>;
  messages: ReceivedMessage[];
};
export const ChatLog = ({ style, messages: transcriptions }: ChatLogProps) => {
  const { localParticipant } = useLocalParticipant();

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ReceivedMessage>) => {
      const isLocalUser = item.from === localParticipant;
      if (isLocalUser) {
        return (
          <View
            style={{
              width: '100%',
              alignContent: 'flex-end',
            }}
          >
            <Text
              style={{
                width: 'auto',
                fontSize: 24,
                fontWeight: 800,
                color: '#000',
                alignSelf: 'flex-end',
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 6,
                margin: 16,
                opacity: 0.6,
              }}
            >
              {item.message}
            </Text>
          </View>
        );
      } else {
        return (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              marginHorizontal: 16,
              marginVertical: 8,
            }}
          >
            <Image
              source={require('@/assets/images/icon.png')}
              style={{
                width: 40,
                height: 40,
                backgroundColor: '#fff',
                borderRadius: 999,
                marginRight: 12,
              }}
              contentFit='cover'
            />

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '800',
                  color: '#000',
                }}
              >
                {item.message}
              </Text>
            </View>
          </View>
        );
      }
    },
    [localParticipant],
  );

  return (
    <Animated.FlatList
      renderItem={renderItem}
      data={transcriptions.toReversed()}
      style={style}
      inverted={true}
      itemLayoutAnimation={LinearTransition}
    />
  );
};
