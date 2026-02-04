// components/subscription/subscription-card.tsx
import { Platform, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Check, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style);
  }
};

interface SubscriptionCardProps {
  title: string;
  price: string;
  period: string;
  savings?: string;
  isSelected: boolean;
  isRecommended?: boolean;
  onPress: () => void;
}

export function SubscriptionCard({
  title,
  price,
  period,
  savings,
  isSelected,
  isRecommended = false,
  onPress,
}: SubscriptionCardProps) {
  const pressed = useSharedValue(0);
  const scale = useSharedValue(isSelected ? 1.02 : 1);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(pressed.value, [0, 1], [0, 4]);
    return {
      transform: [{ translateY }, { scale: scale.value }],
    };
  });

  const handlePress = () => {
    pressed.value = withSpring(1, { damping: 15 });
    setTimeout(() => {
      pressed.value = withSpring(0, { damping: 15 });
    }, 150);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={{ position: 'relative' }}>
      {/* Recommended Badge */}
      {isRecommended && (
        <View
          style={{
            position: 'absolute',
            top: -8,
            right: 12,
            zIndex: 10,
            backgroundColor: '#34C759',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            borderWidth: 2,
            borderColor: '#000',
          }}
        >
          <Sparkles size={12} color='#FFF' />
          <Text
            style={{
              color: '#FFF',
              fontSize: 11,
              fontWeight: '800',
            }}
          >
            BEST VALUE
          </Text>
        </View>
      )}

      {/* Shadow */}
      <View
        style={{
          position: 'absolute',
          top: 6,
          left: 0,
          right: 0,
          height: 120,
          backgroundColor: isSelected ? '#E5C000' : '#38383A',
          borderRadius: 24,
        }}
      />

      {/* Main Card */}
      <Animated.View
        style={[
          {
            height: 120,
            backgroundColor: isSelected ? '#FAD40B' : '#1C1C1E',
            borderRadius: 24,
            borderWidth: 4,
            borderColor: isSelected ? '#FAD40B' : '#38383A',
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
          animatedStyle,
        ]}
      >
        {/* Left Content */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '900',
              color: isSelected ? '#000' : '#FFF',
              marginBottom: 4,
            }}
          >
            {title}
          </Text>

          <View
            style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: '900',
                color: isSelected ? '#000' : '#FAD40B',
              }}
            >
              {price}
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: isSelected ? '#000' : '#999',
              }}
            >
              {period}
            </Text>
          </View>

          {savings && (
            <View
              style={{
                backgroundColor: isSelected ? '#000' : '#34C759',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                alignSelf: 'flex-start',
                marginTop: 8,
              }}
            >
              <Text
                style={{
                  color: '#FFF',
                  fontSize: 12,
                  fontWeight: '800',
                }}
              >
                {savings}
              </Text>
            </View>
          )}
        </View>

        {/* Right - Check Icon */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: isSelected ? '#000' : 'rgba(255, 255, 255, 0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 3,
            borderColor: isSelected ? '#000' : 'rgba(255, 255, 255, 0.2)',
          }}
        >
          {isSelected && <Check size={28} color='#FAD40B' strokeWidth={4} />}
        </View>
      </Animated.View>
    </Pressable>
  );
}
