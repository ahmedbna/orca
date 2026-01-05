// components/onboarding/voice-download.tsx

import React, { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColor } from '@/hooks/useColor';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Image } from 'expo-image';
import { usePiperTTS } from '@/hooks/usePiperTTS';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Spinner } from '@/components/ui/spinner';
import { Doc } from '@/convex/_generated/dataModel';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style);
  }
};

export const VoiceDownload = ({
  models,
  learningLanguage,
  userData,
}: {
  models: Array<Doc<'piperModels'>>;
  learningLanguage: string;
  userData: {
    gender: string;
    birthday?: number;
    nativeLanguage: string;
    learningLanguage: string;
  };
}) => {
  const insets = useSafeAreaInsets();

  const border = useColor('border');
  const background = useColor('background');

  const updateUser = useMutation(api.users.update);
  const initializeProgress = useMutation(api.courses.initializeProgress);

  const { initializeTTS, downloadProgress, isDownloading } = usePiperTTS({
    models: models || [],
  });

  const [initComplete, setInitComplete] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [backendUpdateComplete, setBackendUpdateComplete] = useState(false);

  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.3);

  // Animations
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    rotate.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  // Initialize voice + backend
  useEffect(() => {
    const run = async () => {
      if (!models) return;

      try {
        // Find the default model for the learning language
        const defaultModel = models.find((m) => m.code === learningLanguage);

        if (!defaultModel) {
          console.error('No model found for language:', learningLanguage);
          return;
        }

        // Initialize TTS with language code
        await initializeTTS(defaultModel._id);
        setInitComplete(true);
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

        // Update user data
        await updateUser({ ...userData, piperId: defaultModel._id });

        // Initialize course progress
        await initializeProgress();

        setBackendUpdateComplete(true);
      } catch (err) {
        console.error('Voice download onboarding failed:', err);
      }
    };

    run();
  }, [learningLanguage, models]);

  const model = models.find((m) => m.code === learningLanguage);
  const modelId = model?.modelId;

  const progress = modelId ? (downloadProgress[modelId] ?? 0) : 0;
  const progressPercent = Math.round(progress * 100);

  useEffect(() => {
    if (progress >= 1 && !downloadComplete) {
      setDownloadComplete(true);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [progress]);

  const BOTTOM_BAR_HEIGHT = insets.bottom + 140;

  return (
    <View style={{ flex: 1 }}>
      {/* Main content */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Image
          contentFit='cover'
          source={require('@/assets/videos/swim.webp')}
          style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.6 }}
        />

        <Text
          style={{
            fontSize: 28,
            fontWeight: '900',
            color: background,
            textAlign: 'center',
          }}
        >
          {backendUpdateComplete
            ? 'All Set!'
            : initComplete
              ? 'Saving Profile...'
              : 'Loading Orca...'}
        </Text>
      </View>

      {/* Bottom progress bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: BOTTOM_BAR_HEIGHT,
          backgroundColor: '#F6C90E',
          paddingHorizontal: 16,
          paddingTop: 36,
          paddingBottom: insets.bottom,
        }}
      >
        {isDownloading && !downloadComplete && (
          <View style={{ width: '100%' }}>
            {/* Progress Bar */}
            <View
              style={{
                height: 64,
                borderRadius: 999,
                backgroundColor: background,
                borderWidth: 3,
                borderColor: border,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Fill */}
              <View
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  backgroundColor: '#30D158',
                  borderRadius: 999,
                }}
              />

              {/* Centered Percentage */}
              <View
                style={{
                  position: 'absolute',
                  inset: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '800',
                    color: '#FFF',
                  }}
                >
                  {progressPercent}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {(downloadComplete || initComplete) && !backendUpdateComplete && (
          <Spinner size='lg' variant='circle' color='#000' />
        )}
      </View>
    </View>
  );
};
