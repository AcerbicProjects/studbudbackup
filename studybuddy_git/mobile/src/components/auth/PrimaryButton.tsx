import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, GestureResponderEvent, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: any;
}

export const PrimaryButton: React.FC<ButtonProps> = ({ title, onPress, disabled, style }) => {
  const { colors, borderRadius, spacing, typography, shadows } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.touchable,
        disabled && styles.disabled,
        !disabled && shadows,
        style,
      ]}
    >
      <LinearGradient
        colors={[colors.primary, '#6366F1']} // Gradient from Primary #4F46E5 to slightly lighter Indigo
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: borderRadius.lg }]}
      >
        <Text style={[styles.text, { fontSize: typography.fontSize.md, color: '#FFFFFF' }]}>
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const SecondaryButton: React.FC<ButtonProps> = ({ title, onPress, disabled, style }) => {
  const { colors, borderRadius, spacing, typography, shadows } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.touchable,
        disabled && styles.disabled,
        !disabled && shadows,
        style,
      ]}
    >
      <LinearGradient
        colors={[colors.secondary, '#A78BFA']} // Gradient from Secondary #8B5CF6 to slightly lighter Purple
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: borderRadius.lg }]}
      >
        <Text style={[styles.text, { fontSize: typography.fontSize.md, color: '#FFFFFF' }]}>
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const OutlinedButton: React.FC<ButtonProps> = ({ title, onPress, disabled, style }) => {
  const { colors, borderRadius, spacing, typography } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.outlinedContainer,
        {
          borderColor: colors.primary,
          borderRadius: borderRadius.lg,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.outlinedText, { fontSize: typography.fontSize.md, color: colors.primary }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

interface SocialButtonProps {
  onPress: (event: GestureResponderEvent) => void;
  provider: 'google' | 'apple';
  style?: any;
}

export const SocialLoginButton: React.FC<SocialButtonProps> = ({ onPress, provider, style }) => {
  const { colors, borderRadius, spacing, typography } = useTheme();

  const isGoogle = provider === 'google';
  const label = isGoogle ? 'Continue with Google' : 'Continue with Apple';
  const iconName = isGoogle ? 'google' : 'apple';
  const iconColor = isGoogle ? '#EA4335' : colors.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.socialButton,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: borderRadius.lg,
        },
        style,
      ]}
    >
      <View style={styles.socialContent}>
        <MaterialCommunityIcons name={iconName} size={20} color={iconColor} style={styles.socialIcon} />
        <Text style={[styles.socialText, { fontSize: typography.fontSize.md, color: colors.text }]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  outlinedContainer: {
    width: '100%',
    height: 54,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  outlinedText: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  socialButton: {
    width: '100%',
    height: 54,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    marginRight: 12,
  },
  socialText: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.5,
  },
});
export default PrimaryButton;
