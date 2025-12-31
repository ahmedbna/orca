// components/onboarding/onboarding.tsx
import React, { useState } from 'react';
import { Dimensions, Pressable, TextInput } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Jellyfish } from '@/components/orca/jellyfish';
import { Bubbles } from '@/components/orca/bubbles';
import { Clouds } from '@/components/orca/clouds';
import { Shark } from '@/components/orca/shark';
import { useColor } from '@/hooks/useColor';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { NATIVES, LANGUAGES } from '@/constants/languages';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHADOW_HEIGHT = 8;

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

// 3D Squishy Button Component
interface SquishyButtonProps {
  onPress: () => void;
  label: string;
  variant?: 'yellow' | 'white' | 'black' | 'green' | 'gray' | 'red';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  selected?: boolean;
  style?: any;
}

const SquishyButton: React.FC<SquishyButtonProps> = ({
  onPress,
  label,
  variant = 'yellow',
  disabled = false,
  loading = false,
  icon,
  selected = false,
  style = {},
}) => {
  const pressed = useSharedValue(0);

  const colors = {
    yellow: {
      face: '#FAD40B',
      shadow: '#E5C000',
      text: '#000000',
      border: 'rgba(0,0,0,0.1)',
    },
    white: {
      face: '#FFFFFF',
      shadow: '#D1D5DB',
      text: '#000000',
      border: 'rgba(0,0,0,0.1)',
    },
    black: {
      face: '#000000',
      shadow: '#2A2A2A',
      text: '#FFFFFF',
      border: 'rgba(255,255,255,0.1)',
    },
    green: {
      face: '#34C759',
      shadow: '#2E9E4E',
      text: '#FFFFFF',
      border: 'rgba(0,0,0,0.1)',
    },
    gray: {
      face: '#D1D5DB',
      shadow: '#AFB2B7',
      text: '#000',
      border: 'rgba(0,0,0,0.1)',
    },
    red: {
      face: '#FF3B30',
      shadow: '#C1271D',
      text: '#FFFFFF',
      border: 'rgba(0,0,0,0.15)',
    },
  };

  const buttonColors = disabled ? colors.gray : colors[variant];

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(pressed.value, [0, 1], [0, SHADOW_HEIGHT]);
    return { transform: [{ translateY }] };
  });

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withSpring(1, { damping: 15 });
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 15 });
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      }}
      style={[
        { height: 64, width: '100%', opacity: disabled ? 0.6 : 1 },
        style,
      ]}
    >
      <View
        pointerEvents='none'
        style={{
          backgroundColor: buttonColors.shadow,
          position: 'absolute',
          top: SHADOW_HEIGHT,
          left: 0,
          right: 0,
          height: 64,
          borderRadius: 999,
          zIndex: 1,
        }}
      />

      <Animated.View
        pointerEvents='none'
        style={[
          {
            backgroundColor: selected ? '#34C759' : buttonColors.face,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 64,
            borderRadius: 999,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2,
            borderWidth: 4,
            borderColor: selected ? 'rgba(0,0,0,0.2)' : buttonColors.border,
            flexDirection: 'row',
            gap: 12,
          },
          animatedStyle,
        ]}
      >
        {icon && <Text style={{ fontSize: 22 }}>{icon}</Text>}
        <Text
          style={{
            color: selected ? '#FFF' : buttonColors.text,
            fontSize: 18,
            fontWeight: '800',
          }}
        >
          {loading ? 'Loading...' : label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

// 3D Squishy TextArea Component
interface SquishyTextAreaProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon?: string;
  maxLength?: number;
}

const SquishyTextArea: React.FC<SquishyTextAreaProps> = ({
  value,
  onChangeText,
  placeholder,
  icon,
  maxLength = 150,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const handleFocus = () => {
    setIsFocused(true);
    focusAnim.value = withSpring(1, { damping: 15 });
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusAnim.value = withSpring(0, { damping: 15 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(focusAnim.value, [0, 1], [0, 3]);
    return { transform: [{ translateY }] };
  });

  return (
    <View style={{ width: '100%' }}>
      <View style={{ minHeight: 120, position: 'relative' }}>
        <View
          style={{
            backgroundColor: '#38383A',
            position: 'absolute',
            top: 6,
            left: 0,
            right: 0,
            height: '100%',
            borderRadius: 24,
            zIndex: 1,
          }}
        />

        <Animated.View
          style={[
            {
              backgroundColor: '#1C1C1E',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              minHeight: 120,
              borderRadius: 24,
              borderWidth: 4,
              borderColor: isFocused ? '#FAD40B' : '#38383A',
              zIndex: 2,
              padding: 16,
              gap: 8,
            },
            animatedStyle,
          ]}
        >
          {icon && (
            <Text style={{ fontSize: 20, alignSelf: 'flex-start' }}>
              {icon}
            </Text>
          )}
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor='#a1a1aa'
            multiline
            maxLength={maxLength}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              flex: 1,
              fontSize: 16,
              fontWeight: '600',
              color: '#FFF',
              textAlignVertical: 'top',
              minHeight: 80,
            }}
          />
          <Text
            style={{
              color: '#a1a1aa',
              fontSize: 12,
              alignSelf: 'flex-end',
              fontWeight: '600',
            }}
          >
            {value.length}/{maxLength}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

// Progress Indicator
interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        marginBottom: 24,
      }}
    >
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={{
            width: 40,
            height: 8,
            borderRadius: 4,
            backgroundColor: index <= currentStep ? '#FAD40B' : '#38383A',
          }}
        />
      ))}
    </View>
  );
};

export const Onboarding: React.FC<{ onComplete: () => void }> = ({
  onComplete,
}) => {
  const yellow = useColor('orca');
  const insets = useSafeAreaInsets();
  const updateUser = useMutation(api.users.update);

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form state
  const [gender, setGender] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [nativeLanguage, setNativeLanguage] = useState<string>('');
  const [learningLanguage, setLearningLanguage] = useState<string>('');

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return gender !== '' && bio.trim().length >= 10;
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
          gender,
          bio,
          nativeLanguage,
          learningLanguage,
        });
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
        onComplete();
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

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 24,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <KeyboardAwareScrollView
          bottomOffset={24}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={{ flex: 1, gap: 24 }}>
            <ProgressIndicator currentStep={currentStep} totalSteps={3} />

            {/* Step 1: Gender and Bio */}
            {currentStep === 0 && (
              <View style={{ gap: 20 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 48 }}>👤</Text>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: '900',
                      color: '#FFF',
                      marginTop: 8,
                    }}
                  >
                    Tell us about yourself
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      color: '#71717a',
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
                      color: '#FFF',
                      fontSize: 16,
                      fontWeight: '700',
                      marginBottom: -8,
                    }}
                  >
                    Select your gender
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 12,
                      justifyContent: 'space-between',
                    }}
                  >
                    <SquishyButton
                      onPress={() => setGender('male')}
                      label='Male'
                      variant='black'
                      selected={gender === 'male'}
                      icon='👨'
                      style={{ flex: 1 }}
                    />
                    <SquishyButton
                      onPress={() => setGender('female')}
                      label='Female'
                      variant='black'
                      selected={gender === 'female'}
                      icon='👩'
                      style={{ flex: 1 }}
                    />
                  </View>

                  <Text
                    style={{
                      color: '#FFF',
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
                </View>
              </View>
            )}

            {/* Step 2: Native Language */}
            {currentStep === 1 && (
              <View style={{ gap: 20 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 48 }}>🌍</Text>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: '900',
                      color: '#FFF',
                      marginTop: 8,
                    }}
                  >
                    Native Language
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      color: '#71717a',
                      marginTop: 8,
                      textAlign: 'center',
                      fontWeight: '600',
                    }}
                  >
                    Select your mother tongue
                  </Text>
                </View>

                <View style={{ gap: 12, maxHeight: 400 }}>
                  <KeyboardAwareScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ gap: 12 }}
                  >
                    {NATIVES.map((lang) => (
                      <SquishyButton
                        key={lang.code}
                        onPress={() => setNativeLanguage(lang.code)}
                        label={`${lang.flag} ${lang.name}`}
                        variant='black'
                        selected={nativeLanguage === lang.code}
                      />
                    ))}
                  </KeyboardAwareScrollView>
                </View>
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
                      color: '#FFF',
                      marginTop: 8,
                    }}
                  >
                    Learning Language
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      color: '#71717a',
                      marginTop: 8,
                      textAlign: 'center',
                      fontWeight: '600',
                    }}
                  >
                    Which language do you want to learn?
                  </Text>
                </View>

                <View style={{ gap: 12, maxHeight: 400 }}>
                  <KeyboardAwareScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ gap: 12 }}
                  >
                    {LANGUAGES.map((lang) => (
                      <SquishyButton
                        key={lang.code}
                        onPress={() => setLearningLanguage(lang.code)}
                        label={`${lang.flag} ${lang.name}`}
                        variant='black'
                        selected={learningLanguage === lang.code}
                      />
                    ))}
                  </KeyboardAwareScrollView>
                </View>
              </View>
            )}

            {/* Navigation Buttons */}
            <View style={{ gap: 12, marginTop: 46 }}>
              <SquishyButton
                onPress={handleNext}
                label={currentStep === 2 ? 'Setup Profile' : 'Next'}
                variant='green'
                disabled={!canProceed()}
                loading={loading}
                icon={currentStep === 2 ? '✅' : '→'}
              />

              {currentStep > 0 && (
                <SquishyButton
                  onPress={handleBack}
                  label='Back'
                  variant='gray'
                  disabled={loading}
                  icon='←'
                />
              )}
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </View>
  );
};
