import * as Speech from 'expo-speech';
import { useColor } from '@/hooks/useColor';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Pressable } from 'react-native';
import { useState } from 'react';

type Props = {
  native: string;
  language: string;
  lesson: {
    order: number;
    title: string;
    phrases: {
      order: number;
      text: string;
      dictionary: { language: string; text: string }[];
    }[];
  };
};

export const Learn = ({ lesson, native, language }: Props) => {
  const yellow = useColor('orca');

  const [showTranslation, setShowTranslation] = useState(true);

  const currentPhrase = lesson.phrases[9];

  const speak = () => {
    const phrase = currentPhrase.text;

    Speech.speak(phrase);
  };

  return (
    <Pressable
      onPress={speak}
      style={{
        flex: 1,
        padding: 16,
        justifyContent: 'center',
        backgroundColor: yellow,
      }}
    >
      <View>
        <Text
          style={{
            fontSize: 46,
            fontWeight: 800,
            color: '#000000',
          }}
        >
          {currentPhrase.text}
        </Text>

        <Text
          style={[
            {
              fontSize: 46,
              fontWeight: 800,
              color: '#000000',
            },
            showTranslation ? { opacity: 0.6 } : { opacity: 0 },
          ]}
        >
          {currentPhrase.dictionary.find((d) => d.language === native)?.text}
        </Text>
      </View>
    </Pressable>
  );
};
