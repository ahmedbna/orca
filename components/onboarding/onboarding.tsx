// components/onboarding/onboarding.tsx

import React, { useState } from 'react';
import { Dimensions } from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Jellyfish } from '@/components/orca/jellyfish';
import { Bubbles } from '@/components/orca/bubbles';
import { Clouds } from '@/components/orca/clouds';
import { Shark } from '@/components/orca/shark';
import { useColor } from '@/hooks/useColor';
import { NATIVES, LANGUAGES } from '@/constants/languages';
import { Platform } from 'react-native';
import { OrcaButton } from '@/components/squishy/orca-button';
import { Seafloor } from '@/components/orca/seafloor';
import { DatePicker } from '@/components/ui/date-picker';
import { Progress } from '@/components/squishy/progress';
import { Image } from 'expo-image';
import { ScrollView } from '@/components/ui/scroll-view';
import { VoiceDownload } from '@/components/onboarding/voice-download';
import * as Haptics from 'expo-haptics';
import { Doc } from '@/convex/_generated/dataModel';
import { SquishyInput } from '../squishy/squishy-input';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const bubbles = [
  {
    speed: 40,
    count: 15,
    scale: 0.6,
    baseOpacity: 0.3,
    color: 'white',
    yRange: [0, SCREEN_HEIGHT] as [number, number],
  },
  {
    speed: 50,
    count: 14,
    scale: 1,
    baseOpacity: 0.5,
    color: 'white',
    yRange: [0, SCREEN_HEIGHT] as [number, number],
  },
  {
    speed: 60,
    count: 12,
    scale: 1.2,
    baseOpacity: 0.7,
    color: 'white',
    yRange: [0, SCREEN_HEIGHT] as [number, number],
  },
];

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style);
  }
};

export const Onboarding = ({ user }: { user?: Doc<'users'> }) => {
  const insets = useSafeAreaInsets();
  const yellow = useColor('orca');
  const border = useColor('border');
  const background = useColor('background');

  const [currentStep, setCurrentStep] = useState(0);
  const [showDownload, setShowDownload] = useState(false);

  // Form state
  const [name, setName] = useState(user?.name || '');
  const [gender, setGender] = useState<string>('');
  const [birthday, setBirthday] = useState<Date | undefined>();
  const [nativeLanguage, setNativeLanguage] = useState<string>('');
  const [learningLanguage, setLearningLanguage] = useState<string>('');

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return gender !== '' && birthday !== undefined;
      case 1:
        return nativeLanguage !== '';
      case 2:
        return learningLanguage !== '';
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      // Final step - start download immediately
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setShowDownload(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const today = new Date();
  const maxSelectableBirthday = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  );

  const BOTTOM_BAR_HEIGHT = insets.bottom + 140;

  return (
    <View style={{ flex: 1, backgroundColor: yellow }} pointerEvents='box-none'>
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
          height: insets.top + 24,
          zIndex: 10,
        }}
      />

      <Clouds />
      <Bubbles layers={bubbles} />
      <Shark />
      <Jellyfish />
      <Seafloor speed={0} bottom={BOTTOM_BAR_HEIGHT} />

      {showDownload ? (
        <VoiceDownload
          learningLanguage={learningLanguage}
          userData={{
            gender,
            birthday: birthday ? birthday.getTime() : undefined,
            nativeLanguage,
            learningLanguage,
          }}
        />
      ) : (
        <View
          style={{
            flex: 1,
            paddingTop: insets.top + 24,
            paddingHorizontal: 16,
          }}
        >
          {currentStep === 0 && (
            <View style={{ gap: 24 }}>
              <View style={{ alignItems: 'center' }}>
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: -36,
                    marginBottom: -46,
                  }}
                >
                  <Image
                    source={require('@/assets/images/icon.png')}
                    style={{ width: 190, height: 190 }}
                    contentFit='contain'
                  />
                </View>

                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: '900',
                    color: background,
                    marginTop: 8,
                  }}
                >
                  Tell us about yourself
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: border,
                    marginTop: 8,
                    textAlign: 'center',
                    fontWeight: '600',
                  }}
                >
                  Help us personalize your experience
                </Text>
              </View>

              <View style={{ gap: 16, marginBottom: 64 }}>
                <Text
                  style={{
                    color: background,
                    fontSize: 16,
                    fontWeight: '700',
                    marginBottom: -8,
                  }}
                >
                  Type your name
                </Text>
                <SquishyInput
                  value={name}
                  placeholder='Full Name'
                  onChangeText={setName}
                  autoCapitalize='words'
                  containerStyle={{ flex: 1 }}
                  icon='🙋‍♂️'
                />
              </View>

              <View style={{ gap: 16 }}>
                <Text
                  style={{
                    color: background,
                    fontSize: 16,
                    fontWeight: '700',
                    marginBottom: -8,
                  }}
                >
                  Select your gender
                </Text>
                <View
                  style={{
                    gap: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <OrcaButton
                    label='👨 Male'
                    style={{ flex: 1 }}
                    onPress={() => setGender('male')}
                    variant={gender === 'male' ? 'green' : 'black'}
                  />

                  <OrcaButton
                    label='👩 Female'
                    style={{ flex: 1 }}
                    onPress={() => setGender('female')}
                    variant={gender === 'female' ? 'green' : 'black'}
                  />
                </View>
              </View>

              <View style={{ gap: 16 }}>
                <Text
                  style={{
                    color: background,
                    fontSize: 16,
                    fontWeight: '700',
                    marginBottom: -8,
                  }}
                >
                  Select your Birthday
                </Text>
                <DatePicker
                  variant='orca'
                  label='Birthday'
                  value={birthday}
                  onChange={setBirthday}
                  maximumDate={maxSelectableBirthday}
                />
              </View>
            </View>
          )}

          {currentStep === 1 && (
            <View style={{ flex: 1, gap: 20 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 48 }}>🌍</Text>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: '900',
                    color: background,
                    marginTop: 8,
                  }}
                >
                  Native Language
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: border,
                    marginTop: 8,
                    textAlign: 'center',
                    fontWeight: '600',
                  }}
                >
                  Select your mother tongue
                </Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  gap: 12,
                  paddingTop: 16,
                  paddingBottom: BOTTOM_BAR_HEIGHT + 120,
                  flexGrow: 1,
                }}
              >
                {NATIVES.map((lang) => (
                  <OrcaButton
                    key={lang.code}
                    onPress={() => setNativeLanguage(lang.code)}
                    label={`${lang.flag} ${lang.native}`}
                    variant={nativeLanguage === lang.code ? 'green' : 'black'}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {currentStep === 2 && (
            <View style={{ gap: 20 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 48 }}>🎯</Text>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: '900',
                    color: background,
                    marginTop: 8,
                  }}
                >
                  Learning Language
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: border,
                    marginTop: 8,
                    textAlign: 'center',
                    fontWeight: '600',
                  }}
                >
                  Which language do you want to learn?
                </Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  gap: 12,
                  paddingTop: 16,
                  paddingBottom: BOTTOM_BAR_HEIGHT + 120,
                  flexGrow: 1,
                }}
              >
                {LANGUAGES.filter((lan) => lan.code !== nativeLanguage).map(
                  (lang) => (
                    <OrcaButton
                      key={lang.code}
                      onPress={() => setLearningLanguage(lang.code)}
                      label={`${lang.flag} ${lang.native}`}
                      variant={
                        learningLanguage === lang.code ? 'green' : 'black'
                      }
                    />
                  )
                )}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {!showDownload ? (
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
              gap: 16,
              height: BOTTOM_BAR_HEIGHT,
              overflow: 'hidden',
              zIndex: 99,
            },
          ]}
        >
          <Progress
            total={3}
            correctSegments={Array.from(
              { length: currentStep + 1 },
              (_, i) => i
            )}
            failedSegments={[]}
          />

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {currentStep > 0 && (
              <OrcaButton
                onPress={handleBack}
                label='Back'
                variant='gray'
                style={{ flex: 1 }}
              />
            )}

            <OrcaButton
              onPress={handleNext}
              label={currentStep === 2 ? 'Setup Profile' : 'Next'}
              variant='green'
              disabled={!canProceed()}
              style={{ flex: 3 }}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
};
