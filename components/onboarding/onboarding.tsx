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
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { NATIVES, LANGUAGES } from '@/constants/languages';
import { Platform } from 'react-native';
import { OrcaButton } from '@/components/squishy/orca-button';
import { Seafloor } from '@/components/orca/seafloor';
import { DatePicker } from '@/components/ui/date-picker';
import { Progress } from '@/components/orca/progress';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { ScrollView } from '../ui/scroll-view';

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

export const Onboarding = () => {
  const yellow = useColor('orca');
  const border = useColor('border');
  const background = useColor('background');

  const insets = useSafeAreaInsets();
  const updateUser = useMutation(api.users.update);

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form state
  const [gender, setGender] = useState<string>('');
  // const [bio, setBio] = useState<string>('');
  const [birthday, setBirthday] = useState<Date | undefined>();
  const [nativeLanguage, setNativeLanguage] = useState<string>('');
  const [learningLanguage, setLearningLanguage] = useState<string>('');

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        // return gender !== '' && bio.trim().length >= 10;
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
      // Final step - submit data
      setLoading(true);
      try {
        await updateUser({
          // bio,
          gender,
          birthday: birthday ? birthday.getTime() : undefined,
          nativeLanguage,
          learningLanguage,
        });
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.error('Failed to update user:', error);
      } finally {
        setLoading(false);
      }
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

      {/* Background Elements */}
      <Clouds />
      <Bubbles layers={bubbles} />
      <Shark />
      <Jellyfish />
      <Seafloor speed={0} bottom={BOTTOM_BAR_HEIGHT} />

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
          correctSegments={Array.from({ length: currentStep + 1 }, (_, i) => i)}
          failedSegments={[]}
        />

        {/* Navigation Buttons */}
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
              disabled={loading}
              style={{ flex: 1 }}
            />
          )}

          <OrcaButton
            onPress={handleNext}
            label={currentStep === 2 ? 'Setup Profile' : 'Next'}
            variant='green'
            disabled={!canProceed()}
            loading={loading}
            style={{ flex: 3 }}
          />
        </View>
      </View>

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 24,
          paddingHorizontal: 16,
        }}
      >
        {/* Step 1: Gender and Bio */}
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
                disabled={loading}
              />
            </View>

            {/* <View>
                  <Text
                    style={{
                      color: background,
                      fontSize: 16,
                      fontWeight: '700',
                      marginTop: 8,
                      marginBottom: -8,
                    }}
                  >
                    Write a short bio
                  </Text>
                  <SquishyTextArea
                    value={bio}
                    onChangeText={setBio}
                    placeholder='Tell us about yourself...'
                    icon='✍️'
                    maxLength={150}
                  />
                </View> */}
          </View>
        )}

        {/* Step 2: Native Language */}
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

        {/* Step 3: Learning Language */}
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
                    variant={learningLanguage === lang.code ? 'green' : 'black'}
                  />
                )
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};
