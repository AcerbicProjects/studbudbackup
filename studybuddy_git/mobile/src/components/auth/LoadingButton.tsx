import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, GestureResponderEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../constants/theme';

interface LoadingButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  isLoading: boolean;
  disabled?: boolean;
  style?: any;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  title,
  onPress,
  isLoading,
  disabled = false,
  style,
}) => {
  const { colors, borderRadius, typography, shadows } = useTheme();

  const handlePress = (e: GestureResponderEvent) => {
    if (!isLoading && !disabled && onPress) {
      onPress(e);
    }
  };

  const isButtonDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isButtonDisabled}
      activeOpacity={0.8}
      style={[
        styles.touchable,
        isButtonDisabled && styles.disabled,
        !isButtonDisabled && shadows,
        style,
      ]}
    >
      <LinearGradient
        colors={[colors.primary, '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: borderRadius.lg }]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FFFFFF" style={styles.spinner} />
            <Text style={[styles.text, { fontSize: typography.fontSize.md, color: '#FFFFFF' }]}>
              Please wait...
            </Text>
          </View>
        ) : (
          <Text style={[styles.text, { fontSize: typography.fontSize.md, color: '#FFFFFF' }]}>
            {title}
          </Text>
        )}
      </LinearGradient>
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginRight: 10,
  },
  disabled: {
    opacity: 0.6,
  },
});
export default LoadingButton;
