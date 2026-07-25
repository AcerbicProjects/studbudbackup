import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  showThemeToggle?: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  subtitle,
  onBackPress,
}) => {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={[styles.container, { marginBottom: spacing.xl }]}>
      {onBackPress && (
        <TouchableOpacity
          onPress={onBackPress}
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
      )}
      
      <Text style={[
        styles.title, 
        { 
          color: colors.text, 
          fontSize: typography.fontSize.xxl,
          marginTop: onBackPress ? spacing.md : 0,
        }
      ]}>
        {title}
      </Text>
      
      {subtitle && (
        <Text style={[
          styles.subtitle, 
          { 
            color: colors.textMuted, 
            fontSize: typography.fontSize.md,
            marginTop: spacing.xs,
          }
        ]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontWeight: '400',
    lineHeight: 22,
  },
});
export default AuthHeader;
