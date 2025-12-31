// components/auth/password.tsx

import React, { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { Platform, Pressable, TextInput } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import * as Haptics from 'expo-haptics';

type AuthStep = 'signIn' | 'signUp' | 'forgotPassword' | 'resetPassword';

const SHADOW_HEIGHT = 8;

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
}

const SquishyButton: React.FC<SquishyButtonProps> = ({
  onPress,
  label,
  variant = 'yellow',
  disabled = false,
  loading = false,
  icon,
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
      style={{ height: 64, width: '100%', opacity: disabled ? 0.6 : 1 }}
    >
      {/* Shadow */}
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

      {/* Face */}
      <Animated.View
        pointerEvents='none'
        style={[
          {
            backgroundColor: buttonColors.face,
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
            borderColor: buttonColors.border,
            flexDirection: 'row',
            gap: 12,
          },
          animatedStyle,
        ]}
      >
        {icon && <Text style={{ fontSize: 22 }}>{icon}</Text>}
        <Text
          style={{ color: buttonColors.text, fontSize: 18, fontWeight: '800' }}
        >
          {loading ? 'Loading...' : label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

// 3D Squishy Input Component
interface SquishyInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  editable?: boolean;
  icon?: string;
  containerStyle?: object;
  maxLength?: number;
}

const SquishyInput: React.FC<SquishyInputProps> = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error = '',
  editable = true,
  icon,
  containerStyle = {},
  maxLength,
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
    <View style={[{ width: '100%' }, containerStyle]}>
      <View style={{ height: 64, position: 'relative' }}>
        {/* Shadow */}
        <View
          style={{
            backgroundColor: '#38383A',
            position: 'absolute',
            top: 6,
            left: 0,
            right: 0,
            height: 64,
            borderRadius: 999,
            zIndex: 1,
          }}
        />

        {/* Input Face */}
        <Animated.View
          style={[
            {
              backgroundColor: '#1C1C1E',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 64,
              borderRadius: 999,
              borderWidth: 4,
              borderColor: isFocused ? '#FAD40B' : '#38383A',
              zIndex: 2,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              gap: 12,
            },
            animatedStyle,
          ]}
        >
          {icon && <Text style={{ fontSize: 20 }}>{icon}</Text>}
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor='#a1a1aa'
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            editable={editable}
            maxLength={maxLength}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              flex: 1,
              fontSize: 18,
              fontWeight: 700,
              color: '#FFF',
              height: '100%',
            }}
          />
        </Animated.View>
      </View>
      {error ? (
        <Text
          style={{
            color: '#FF3B30',
            fontSize: 14,
            marginTop: 8,
            marginLeft: 4,
            fontWeight: '600',
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
};

// 3D Card Component
interface SquishyCardProps {
  children: React.ReactNode;
  style?: object;
}

const SquishyCard: React.FC<SquishyCardProps> = ({ children, style = {} }) => {
  return (
    <View style={[{ position: 'relative' }, style]}>
      {/* Shadow */}
      <View
        style={{
          backgroundColor: '#E5C000',
          position: 'absolute',
          top: 8,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 32,
        }}
      />

      {/* Card Face */}
      <View
        style={{
          backgroundColor: '#000',
          borderRadius: 32,
          padding: 24,
          borderWidth: 5,
          borderColor: 'rgba(0,0,0,0.1)',
        }}
      >
        {children}
      </View>
    </View>
  );
};

// Link Button Component
interface LinkButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const LinkButton: React.FC<LinkButtonProps> = ({
  onPress,
  children,
  disabled = false,
}) => {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pressed.value, [0, 1], [1, 0.7]),
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.98]) }],
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        pressed.value = withSpring(1, { damping: 15 });
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => (pressed.value = withSpring(0, { damping: 15 }))}
      style={{ marginTop: 8 }}
    >
      <Animated.Text
        style={[
          {
            color: '#FFF',
            fontSize: 15,
            fontWeight: '700',
            textAlign: 'center',
            textDecorationLine: 'underline',
          },
          animatedStyle,
        ]}
      >
        {children}
      </Animated.Text>
    </Pressable>
  );
};

export const Password: React.FC = () => {
  const { signIn } = useAuthActions();

  const [step, setStep] = useState<AuthStep>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetFormState = () => {
    setEmail('');
    setPassword('');
    setCode('');
    setNewPassword('');
    setError('');
    setLoading(false);
  };

  const changeStep = (newStep: AuthStep) => {
    resetFormState();
    setStep(newStep);
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setError('Please enter a valid email address.');
      return false;
    }
    setError('');
    return true;
  };

  const validatePassword = (value: string) => {
    if (
      value.length < 8 ||
      !/\d/.test(value) ||
      !/[a-z]/.test(value) ||
      !/[A-Z]/.test(value)
    ) {
      setError(
        'Password must be 8+ characters with uppercase, lowercase, and numbers.'
      );
      return false;
    }
    setError('');
    return true;
  };

  const handleSignInUpSubmit = async () => {
    if (!validateEmail(email) || !validatePassword(password)) return;

    setLoading(true);
    setError('');

    try {
      await signIn('password', { name, email, password, flow: step });

      if (step === 'signUp') {
        setPassword('');
      }
    } catch (err: any) {
      console.error(`${step} error:`, err);
      setError('Authentication failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetCode = async () => {
    if (!validateEmail(email)) return;

    setLoading(true);
    setError('');

    try {
      await signIn('password', { email, flow: 'reset' });
      setStep('resetPassword');
    } catch (err: any) {
      console.error('Send reset code error:', err);
      setError(
        'Failed to send reset code. Please check the email and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validatePassword(newPassword)) return;
    if (code.length < 6) {
      setError('Please enter the 6-digit reset code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn('password', {
        email,
        code,
        newPassword,
        flow: 'reset-verification',
      });

      changeStep('signIn');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError('Failed to reset password. The code may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'forgotPassword') {
    return (
      <SquishyCard>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 48 }}>🔑</Text>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '900',
              color: '#FFF',
              marginTop: 8,
            }}
          >
            Reset Password
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
            Enter your email to receive a reset code
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          <SquishyInput
            value={email}
            placeholder='me@example.com'
            onChangeText={setEmail}
            keyboardType='email-address'
            error={error}
            editable={!loading}
            icon='📧'
          />

          <SquishyButton
            onPress={handleSendResetCode}
            disabled={loading}
            loading={loading}
            label='Send Reset Code'
            variant='red'
            icon='📨'
          />

          <LinkButton onPress={() => changeStep('signIn')} disabled={loading}>
            Back to Login
          </LinkButton>
        </View>
      </SquishyCard>
    );
  }

  if (step === 'resetPassword') {
    return (
      <SquishyCard>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '900',
              color: '#000',
              marginTop: 8,
            }}
          >
            Enter Reset Code
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
            Check your email for the 6-digit code
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          <SquishyInput
            value={code}
            placeholder='6-digit code'
            onChangeText={setCode}
            keyboardType='number-pad'
            maxLength={6}
            error={error.includes('code') ? error : undefined}
            editable={!loading}
            icon='🔢'
          />

          <SquishyInput
            value={newPassword}
            placeholder='New password'
            onChangeText={setNewPassword}
            secureTextEntry
            error={error.includes('password') ? error : undefined}
            editable={!loading}
            icon='🔑'
          />

          <SquishyButton
            onPress={handleResetPassword}
            disabled={loading}
            loading={loading}
            label='Reset Password'
            variant='green'
            icon='🎯'
          />

          <LinkButton
            onPress={() => changeStep('forgotPassword')}
            disabled={loading}
          >
            Use a different email
          </LinkButton>
        </View>
      </SquishyCard>
    );
  }

  // Default view for 'signIn' and 'signUp'
  const isSigningIn = step === 'signIn';

  return (
    <SquishyCard>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: '#fff',
            textAlign: 'center',
          }}
        >
          Orca
        </Text>
      </View>

      <View style={{ gap: 16 }}>
        {step === 'signUp' && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <SquishyInput
              value={name}
              placeholder='Full Name'
              onChangeText={setName}
              autoCapitalize='words'
              editable={!loading}
              containerStyle={{ flex: 1 }}
              icon='🙋‍♂️'
            />
          </View>
        )}

        <SquishyInput
          value={email}
          placeholder='me@example.com'
          onChangeText={setEmail}
          keyboardType='email-address'
          editable={!loading}
          icon='📮'
        />

        <SquishyInput
          value={password}
          placeholder='Password'
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
          icon='🔑'
        />

        {!!error && (
          <Text
            style={{
              color: '#FF3B30',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: 14,
            }}
          >
            {error}
          </Text>
        )}

        <SquishyButton
          variant='green'
          onPress={handleSignInUpSubmit}
          disabled={loading}
          loading={loading}
          label={isSigningIn ? 'Login' : 'Create Account'}
        />

        <View style={{ gap: 2 }}>
          <LinkButton
            onPress={() => changeStep(isSigningIn ? 'signUp' : 'signIn')}
            disabled={loading}
          >
            {isSigningIn
              ? "Don't have an account? Sign Up"
              : 'Already have an account? Login'}
          </LinkButton>

          {isSigningIn && (
            <LinkButton
              disabled={loading}
              onPress={() => changeStep('forgotPassword')}
            >
              Forgot Password?
            </LinkButton>
          )}
        </View>
      </View>
    </SquishyCard>
  );
};
