import { useMemo, useState } from 'react';
import { Pressable, TouchableOpacity } from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Doc } from '@/convex/_generated/dataModel';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { OrcaButton, OrcaSquareButton } from '@/components/squishy/orca-button';
import { Progress } from '@/components/orca/progress';
import { LANGUAGES } from '@/constants/languages';
import * as Speech from 'expo-speech';

type Props = {
  native: string;
  lesson: Doc<'lessons'> & {
    course: Doc<'courses'>;
  };
};

export const Learn = ({ lesson, native }: Props) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const phrases = useMemo(
    () => [...lesson.phrases].sort((a, b) => a.order - b.order),
    [lesson.phrases]
  );

  const [index, setIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);

  const currentPhrase = phrases[index];

  const handleSpeak = () => {
    Speech.speak(currentPhrase.text);
  };

  const translation = currentPhrase.dictionary?.find(
    (d) => d.language === native
  )?.translation;

  const isFirst = index === 0;
  const isLast = index === phrases.length - 1;

  return (
    <View style={{ flex: 1 }}>
      {/* Phrase */}
      <Pressable
        onPress={handleSpeak}
        style={{
          flex: 1,
          padding: 16,
          position: 'absolute',
          top: insets.top + 140,
        }}
      >
        <View>
          <Text style={{ color: '#000', fontSize: 36, fontWeight: '800' }}>
            {currentPhrase.text}
          </Text>

          {showTranslation && translation && (
            <Text
              style={{
                color: '#000',
                fontSize: 32,
                fontWeight: '800',
                opacity: 0.6,
                marginTop: 8,
              }}
            >
              {translation}
            </Text>
          )}
        </View>
      </Pressable>

      {/* Bottom panel */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#F6C90E',
          paddingBottom: insets.bottom,
          paddingHorizontal: 16,
          gap: 16,
          height: insets.bottom + 240,
          overflow: 'hidden',
          zIndex: 99,
        }}
      >
        {/* Back */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <ChevronLeft size={26} strokeWidth={3} />
          <Text
            style={{
              color: '#000',
              fontSize: 22,
              fontWeight: '800',
              opacity: 0.7,
            }}
          >
            {lesson.title}
          </Text>
        </TouchableOpacity>

        {/* ✅ Progress shows CURRENT phrase */}
        <Progress
          total={phrases.length}
          correctSegments={Array.from({ length: index + 1 }, (_, i) => i)}
          failedSegments={[]}
        />

        {/* Controls */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            marginTop: 8,
          }}
        >
          {/* Previous */}
          <OrcaSquareButton
            label='◀︎'
            variant='indigo'
            disabled={isFirst}
            onPress={() => {
              setShowTranslation(false);
              setIndex((i) => Math.max(0, i - 1));
            }}
          />

          {/* Translation */}
          <OrcaSquareButton
            label={LANGUAGES.find((l) => l.code === native)?.flag || '🌐'}
            variant='green'
            onPress={() => setShowTranslation((v) => !v)}
          />

          {/* Next */}
          <OrcaSquareButton
            label='▶︎'
            variant='indigo'
            disabled={isLast}
            onPress={() => {
              setShowTranslation(false);
              setIndex((i) => Math.min(phrases.length - 1, i + 1));
            }}
          />
        </View>

        {/* Listen */}
        <OrcaButton label='🔊 LISTEN' variant='red' onPress={handleSpeak} />
      </View>
    </View>
  );
};
