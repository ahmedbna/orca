// components/subscription/paywall.tsx
import { Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { OrcaButton } from '@/components/squishy/orca-button';
import { Lock, Crown, X } from 'lucide-react-native';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style);
  }
};

interface PaywallProps {
  visible: boolean;
  onClose?: () => void;
  courseTitle?: string;
}

export function Paywall({ visible, onClose, courseTitle }: PaywallProps) {
  const router = useRouter();
  const shimmer = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Animate in
      scale.value = withSpring(1, { damping: 20 });

      // Shimmer effect for crown
      shimmer.value = withRepeat(
        withSequence(
          withSpring(1, { duration: 1000 }),
          withSpring(0, { duration: 1000 }),
        ),
        -1,
        true,
      );
    } else {
      scale.value = withSpring(0, { damping: 20 });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + shimmer.value * 0.5,
  }));

  if (!visible) return null;

  const handleUpgrade = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(modal)/subscription');
  };

  const handleClose = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    onClose?.();
  };

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // backgroundColor: 'rgba(0, 0, 0, 0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 1000,
      }}
    >
      {/* Close Button */}
      {onClose && (
        <TouchableOpacity
          onPress={handleClose}
          style={{
            position: 'absolute',
            top: 60,
            right: 20,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
        >
          <X size={24} color='#FFF' strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      <Animated.View
        style={[
          {
            maxWidth: 400,
            alignItems: 'center',
          },
          containerStyle,
        ]}
      >
        {/* Animated Crown Icon */}
        <Animated.View
          style={[
            {
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: '#FAD40B',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              borderWidth: 6,
              borderColor: 'rgba(250, 212, 11, 0.3)',
            },
            shimmerStyle,
          ]}
        >
          <Crown size={50} color='#000' strokeWidth={2.5} />
        </Animated.View>

        {/* Title */}
        <Text
          variant='heading'
          style={{
            color: '#FFF',
            marginBottom: 12,
            textAlign: 'center',
            fontSize: 28,
          }}
        >
          Unlock {courseTitle || 'This Course'}
        </Text>

        {/* Description */}
        <Text
          style={{
            fontSize: 16,
            color: '#999',
            textAlign: 'center',
            marginBottom: 32,
            lineHeight: 24,
          }}
        >
          Upgrade to Orca Plus to access all courses and unlock your full
          language learning potential.
        </Text>

        {/* Benefits */}
        <View style={{ width: '100%', gap: 12, marginBottom: 32 }}>
          <BenefitItem icon='🌍' text='All language courses unlocked' />
          <BenefitItem icon='🎯' text='Advanced lessons & exercises' />
          <BenefitItem icon='🎤' text='Unlimited AI conversation practice' />
          <BenefitItem icon='📊' text='Detailed progress analytics' />
        </View>

        {/* CTA Button */}
        <OrcaButton
          label='Upgrade to Orca Plus'
          variant='yellow'
          onPress={handleUpgrade}
          icon={<Crown size={24} color='#000' />}
        />

        {/* Pricing Info */}
        <Text
          style={{
            fontSize: 14,
            color: '#666',
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          Starting at $49/month or $490/year
        </Text>
      </Animated.View>
    </View>
  );
}

interface BenefitItemProps {
  icon: string;
  text: string;
}

function BenefitItem({ icon, text }: BenefitItemProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(250, 212, 11, 0.1)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(250, 212, 11, 0.2)',
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: '#FAD40B',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          color: '#FFF',
          fontWeight: '600',
        }}
      >
        {text}
      </Text>
    </View>
  );
}
