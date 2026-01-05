// components/study.tsx

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Dimensions, Pressable, TouchableOpacity } from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Doc } from '@/convex/_generated/dataModel';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { OrcaButton } from '@/components/squishy/orca-button';
import { Progress } from '@/components/squishy/progress';
import { NATIVES } from '@/constants/languages';
import { usePiperTTS } from '@/hooks/usePiperTTS';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SPEED_ORDER = ['0.2x', '0.5x', '1.0x', '1.5x', '2.0x'] as const;
type SpeedKey = (typeof SPEED_ORDER)[number];

const VOICE_SPEED: Record<SpeedKey, number> = {
  '0.2x': 0.25,
  '0.5x': 0.5,
  '1.0x': 0.75,
  '1.5x': 0.85,
  '2.0x': 1,
};

type Props = {
  language: string; // e.g. "en", "de"
  native: string;
  lesson: Doc<'lessons'> & { course: Doc<'courses'> };
};

export const Study = ({ language, native, lesson }: Props) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    availableModels,
    initializeTTS,
    speak,
    currentModelId,
    isInitializing,
  } = usePiperTTS();

  const phrases = useMemo(
    () => [...lesson.phrases].sort((a, b) => a.order - b.order),
    [lesson.phrases]
  );

  const [index, setIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);

  const currentPhrase = phrases[index];

  /* ------------------------------ Speed state ------------------------------ */

  const [speedIndex, setSpeedIndex] = useState(2); // default 1.0x
  const currentSpeedKey = SPEED_ORDER[speedIndex];
  const currentSpeedValue = VOICE_SPEED[currentSpeedKey];

  const selectedModel = useMemo(
    () => availableModels.find((m) => m.code === language),
    [availableModels, language]
  );

  useEffect(() => {
    if (!selectedModel) {
      console.warn(`No Piper model found for language code: ${language}`);
      return;
    }

    if (currentModelId !== selectedModel.modelId) {
      initializeTTS(selectedModel.modelId);
    }
  }, [selectedModel, currentModelId, initializeTTS, language]);

  const handleSpeak = useCallback(() => {
    if (isInitializing) return;
    if (!currentPhrase?.text) return;

    speak(currentPhrase.text, currentSpeedValue);
  }, [currentPhrase, speak, isInitializing, currentSpeedValue]);

  const translation = currentPhrase.dictionary?.find(
    (d) => d.language === native
  )?.translation;

  const isFirst = index === 0;
  const isLast = index === phrases.length - 1;

  const handleSpeedPress = () => {
    setSpeedIndex((i) => (i + 1) % SPEED_ORDER.length);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Phrase */}
      <Pressable
        onPress={handleSpeak}
        style={{
          flex: 1,
          padding: 16,
          position: 'absolute',
          top: SCREEN_HEIGHT * 0.3,
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
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              flex: 1,
              marginRight: 12,
            }}
          >
            <ChevronLeft size={26} strokeWidth={3} />

            <Text
              numberOfLines={1}
              ellipsizeMode='tail'
              style={{
                color: '#000',
                fontSize: 22,
                fontWeight: '800',
                opacity: 0.7,
                flexShrink: 1,
              }}
            >
              {lesson.title}
            </Text>
          </TouchableOpacity>

          {/* Speed */}
          <TouchableOpacity onPress={handleSpeedPress}>
            <Text
              style={{
                color: '#000',
                fontSize: 18,
                fontWeight: '800',
                opacity: 0.7,
              }}
            >
              {currentSpeedKey}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <Progress
          total={phrases.length}
          correctSegments={Array.from({ length: index + 1 }, (_, i) => i)}
          failedSegments={[]}
        />

        {/* Controls */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            <OrcaButton
              label='◀︎'
              shape='rounded'
              variant='indigo'
              disabled={isFirst}
              onPress={() => {
                setShowTranslation(false);
                setIndex((i) => Math.max(0, i - 1));
              }}
            />
          </View>

          <View style={{ flex: 1 }}>
            <OrcaButton
              label={NATIVES.find((l) => l.code === native)?.flag || '🌐'}
              shape='rounded'
              variant='green'
              onPress={() => setShowTranslation((v) => !v)}
            />
          </View>

          <View style={{ flex: 1 }}>
            <OrcaButton
              label='▶︎'
              shape='rounded'
              variant='indigo'
              disabled={isLast}
              onPress={() => {
                setShowTranslation(false);
                setIndex((i) => Math.min(phrases.length - 1, i + 1));
              }}
            />
          </View>
        </View>

        <OrcaButton
          label={isInitializing ? '⏳ LOADING VOICE' : '🔊 LISTEN'}
          variant='red'
          disabled={isInitializing}
          onPress={handleSpeak}
        />
      </View>
    </View>
  );
};
