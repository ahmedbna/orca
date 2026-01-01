import React, { useState } from 'react';
import { TextInput } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style);
  }
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
