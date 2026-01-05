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
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

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
  language: string;
  native: string;
  lesson: Doc<'lessons'> & { course: Doc<'courses'> };
  models: Array<Doc<'piperModels'>>;
};

export const Study = ({ language, native, lesson, models }: Props) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Get user's CURRENT voice preference (specific model)
  const userVoice = useQuery(api.piperModels.getUserVoice);

  const { allModels, initializeTTS, speak, currentModelId, isInitializing } =
    usePiperTTS({ models });

  const phrases = useMemo(
    () => [...lesson.phrases].sort((a, b) => a.order - b.order),
    [lesson.phrases]
  );

  const [index, setIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(2); // default 1.0x

  const currentPhrase = phrases[index];
  const currentSpeedKey = SPEED_ORDER[speedIndex];
  const currentSpeedValue = VOICE_SPEED[currentSpeedKey];

  // Use the user's preferred voice, or fallback to first model for language
  const selectedVoice = useMemo(() => {
    // Priority 1: User's saved preference that matches language
    if (userVoice && userVoice.code === language) {
      return userVoice;
    }

    // Priority 2: First available model for this language
    const fallback = allModels.find((m) => m.code === language);

    if (!fallback) {
      console.warn(`⚠️ No voice model available for language: ${language}`);
    }

    return fallback;
  }, [allModels, language, userVoice]);

  // Initialize TTS when component mounts or when selected voice changes
  useEffect(() => {
    if (!selectedVoice) {
      console.error(`❌ No voice available for language: ${language}`);
      return;
    }

    // Only initialize if we're not already using this voice
    if (currentModelId !== selectedVoice.modelId) {
      console.log(
        `🎤 Initializing voice: ${selectedVoice.voice} for language: ${language}`
      );
      initializeTTS(selectedVoice._id);
    }
  }, [selectedVoice, currentModelId, initializeTTS, language]);

  const handleSpeak = useCallback(() => {
    if (isInitializing) {
      console.log('⏳ Voice still initializing...');
      return;
    }

    if (!currentPhrase?.text) {
      console.warn('⚠️ No phrase text to speak');
      return;
    }

    if (!selectedVoice) {
      console.error('❌ No voice selected');
      return;
    }

    console.log(`🔊 Speaking with voice: ${selectedVoice.voice}`);
    speak(currentPhrase.text, currentSpeedValue);
  }, [currentPhrase, speak, isInitializing, currentSpeedValue, selectedVoice]);

  const translation = currentPhrase.dictionary?.find(
    (d) => d.language === native
  )?.translation;

  const isFirst = index === 0;
  const isLast = index === phrases.length - 1;

  const handleSpeedPress = () => {
    setSpeedIndex((i) => (i + 1) % SPEED_ORDER.length);
  };

  const BOTTOM_PANEL_HEIGHT = insets.bottom + 240;

  return (
    <View style={{ flex: 1 }}>
      {/* 🔊 TOP TAP AREA */}
      <Pressable
        onPress={handleSpeak}
        android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
        style={{
          flex: 1,
          paddingHorizontal: 16,
          paddingTop: SCREEN_HEIGHT * 0.32,
          // paddingBottom: BOTTOM_PANEL_HEIGHT,
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

      {/* 🟡 BOTTOM PANEL */}
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
          height: BOTTOM_PANEL_HEIGHT,
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
          label={
            isInitializing
              ? '⏳ LOADING VOICE'
              : selectedVoice
                ? `🔊 LISTEN`
                : '❌ NO VOICE'
          }
          variant='red'
          disabled={isInitializing || !selectedVoice}
          onPress={handleSpeak}
        />
      </View>
    </View>
  );
};
