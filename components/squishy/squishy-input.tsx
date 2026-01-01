import React, { useState } from 'react';
import { Platform, TextInput } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import * as Haptics from 'expo-haptics';

const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style);
  }
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

export const SquishyInput: React.FC<SquishyInputProps> = ({
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
              fontWeight: '700',
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
