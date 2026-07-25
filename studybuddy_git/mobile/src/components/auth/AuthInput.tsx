import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface AuthInputProps extends TextInputProps {
  label?: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  error?: string;
  isValid?: boolean;
  rightAccessory?: React.ReactNode;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  iconName,
  error,
  isValid,
  rightAccessory,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const { colors, spacing, borderRadius, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  // Border and background state styling
  let borderColor = colors.border;
  let activeShadow = {};

  if (error) {
    borderColor = colors.error;
    activeShadow = {
      shadowColor: colors.error,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 3,
    };
  } else if (isFocused) {
    borderColor = '#8B5CF6'; // Purple highlight
    activeShadow = {
      shadowColor: '#8B5CF6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 4,
    };
  }

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={[styles.label, { color: colors.text, fontSize: typography.fontSize.sm }]}>
          {label}
        </Text>
      ) : null}
      
      <View
        style={[
          styles.inputContainer,
          activeShadow,
          {
            backgroundColor: colors.inputBg,
            borderColor: borderColor,
            borderRadius: borderRadius.md,
            borderWidth: isFocused || error ? 1.5 : 1,
          },
        ]}
      >
        {iconName ? (
          <MaterialCommunityIcons
            name={iconName}
            size={20}
            color={error ? colors.error : isFocused ? '#8B5CF6' : colors.textMuted}
            style={styles.icon}
          />
        ) : null}
        
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[
            styles.textInput,
            {
              color: colors.text,
              fontSize: typography.fontSize.md,
            },
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="none"
          {...rest}
        />

        {rightAccessory}

        {/* Validation indicators */}
        {error ? (
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={20}
            color={colors.error}
            style={styles.rightIcon}
          />
        ) : isValid ? (
          <MaterialCommunityIcons
            name="check-circle"
            size={20}
            color={colors.success}
            style={styles.rightIcon}
          />
        ) : null}
      </View>
      
      {error ? (
        <Text style={[styles.errorText, { color: colors.error, fontSize: typography.fontSize.xs }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 18,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  icon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
  },
  rightIcon: {
    marginLeft: 10,
  },
  errorText: {
    marginTop: 6,
    fontWeight: '500',
  },
});
export default AuthInput;
