import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { BORDER_RADIUS, FONT_SIZE } from '@/theme/globals';
import { LucideProps } from 'lucide-react-native';
import React, { forwardRef, useState } from 'react';
import {
  Pressable,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

export interface TextAreaProps extends Omit<
  TextInputProps,
  'style' | 'multiline'
> {
  label?: string;
  error?: string;
  icon?: React.ComponentType<LucideProps>;
  rightComponent?: React.ReactNode | (() => React.ReactNode);
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  variant?: 'filled' | 'outline';
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  showCharCount?: boolean;
  maxLength?: number;
}

export const TextArea = forwardRef<TextInput, TextAreaProps>(
  (
    {
      label,
      error,
      icon,
      rightComponent,
      containerStyle,
      inputStyle,
      labelStyle,
      errorStyle,
      variant = 'filled',
      disabled = false,
      rows = 4,
      showCharCount = false,
      maxLength,
      onFocus,
      onBlur,
      onChangeText,
      placeholder = 'Type your message...',
      value,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [charCount, setCharCount] = useState(value?.length || 0);

    // Theme colors
    const cardColor = useColor('card');
    const textColor = useColor('text');
    const muted = useColor('textMuted');
    const borderColor = useColor('border');
    const primary = useColor('primary');
    const danger = useColor('red');

    // Calculate minimum height based on rows
    const minHeight = rows * 20 + 32; // Approximate line height + padding

    // Variant styles
    const getVariantStyle = (): ViewStyle => {
      const baseStyle: ViewStyle = {
        borderRadius: BORDER_RADIUS,
        minHeight,
        paddingHorizontal: 16,
        paddingVertical: 12,
      };

      switch (variant) {
        case 'outline':
          return {
            ...baseStyle,
            borderWidth: 1,
            borderColor: error ? danger : isFocused ? primary : borderColor,
            backgroundColor: 'transparent',
          };
        case 'filled':
        default:
          return {
            ...baseStyle,
            borderWidth: 1,
            borderColor: error ? danger : cardColor,
            backgroundColor: disabled ? muted + '20' : cardColor,
          };
      }
    };

    const getInputStyle = (): TextStyle => ({
      fontSize: FONT_SIZE,
      lineHeight: 20,
      color: disabled ? muted : error ? danger : textColor,
      paddingVertical: 0,
      textAlignVertical: 'top',
      minHeight: rows * 20,
    });

    const handleFocus = (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleChangeText = (text: string) => {
      setCharCount(text.length);
      onChangeText?.(text);
    };

    // Render right component
    const renderRightComponent = () => {
      if (!rightComponent) return null;
      return typeof rightComponent === 'function'
        ? rightComponent()
        : rightComponent;
    };

    return (
      <View style={containerStyle}>
        {/* TextArea Container */}
        <Pressable
          style={[getVariantStyle(), disabled && { opacity: 0.6 }]}
          onPress={() => {
            if (!disabled && ref && 'current' in ref && ref.current) {
              ref.current.focus();
            }
          }}
          disabled={disabled}
        >
          {/* Header section with icon, label, and right component */}
          {(icon || label || rightComponent) && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8,
                gap: 8,
              }}
            >
              {/* Left section - Icon + Label */}
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
                pointerEvents='none'
              >
                {icon && (
                  <Icon name={icon} size={16} color={error ? danger : muted} />
                )}
                {label && (
                  <Text
                    variant='caption'
                    numberOfLines={1}
                    ellipsizeMode='tail'
                    style={[
                      {
                        color: error ? danger : muted,
                      },
                      labelStyle,
                    ]}
                    pointerEvents='none'
                  >
                    {label}
                  </Text>
                )}
              </View>

              {/* Right Component */}
              {renderRightComponent()}
            </View>
          )}

          {/* TextInput section */}
          <TextInput
            ref={ref}
            multiline
            numberOfLines={rows}
            style={[getInputStyle(), inputStyle]}
            placeholderTextColor={error ? danger + '99' : muted}
            placeholder={placeholder}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            selectionColor={primary}
            value={value}
            onChangeText={handleChangeText}
            maxLength={maxLength}
            {...props}
          />

          {/* Character count */}
          {(showCharCount || maxLength) && (
            <View
              style={{
                marginTop: 8,
                alignItems: 'flex-end',
              }}
              pointerEvents='none'
            >
              <Text
                variant='caption'
                style={{
                  color: maxLength && charCount > maxLength ? danger : muted,
                  fontSize: 12,
                }}
              >
                {charCount}
                {maxLength && ` / ${maxLength}`}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Error Message */}
        {error && (
          <Text
            style={[
              {
                marginLeft: 14,
                marginTop: 4,
                fontSize: 14,
                color: danger,
              },
              errorStyle,
            ]}
          >
            {error}
          </Text>
        )}
      </View>
    );
  }
);

TextArea.displayName = 'TextArea';
