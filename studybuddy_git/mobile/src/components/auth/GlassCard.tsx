import React from 'react';
import { View, StyleSheet, ViewProps, Platform } from 'react-native';
import { useTheme } from '../../constants/theme';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, ...rest }) => {
  const { colors, borderRadius, shadows } = useTheme();

  return (
    <View
      style={[
        styles.card,
        shadows,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: borderRadius.xl,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    padding: 24,
    width: '100%',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
    }),
  },
});
export default GlassCard;
