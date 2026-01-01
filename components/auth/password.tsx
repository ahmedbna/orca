// components/auth/password.tsx
import React, { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { Platform, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { OrcaButton } from '@/components/squishy/orca-button';
import { SquishyCard } from '@/components/squishy/squishy-card';
import { SquishyInput } from '@/components/squishy/squishy-input';
import * as Haptics from 'expo-haptics';

type AuthStep = 'signIn' | 'signUp' | 'forgotPassword' | 'resetPassword';

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

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

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

          <OrcaButton
            onPress={handleSendResetCode}
            disabled={loading}
            loading={loading}
            label='📨 Send Reset Code'
            variant='red'
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
              color: '#FFF',
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

          <OrcaButton
            onPress={handleResetPassword}
            disabled={loading}
            loading={loading}
            label='🎯 Reset Password'
            variant='green'
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

  const isSigningIn = step === 'signIn';

  return (
    <SquishyCard>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: '800',
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

        <OrcaButton
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
