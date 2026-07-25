import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ErrorSnackbarProps {
  visible: boolean;
  message: string;
  type?: 'error' | 'success' | 'info';
  onDismiss: () => void;
  duration?: number;
}

const { width } = Dimensions.get('window');

export const ErrorSnackbar: React.FC<ErrorSnackbarProps> = ({
  visible,
  message,
  type = 'error',
  onDismiss,
  duration = 4000,
}) => {
  const { colors, borderRadius, spacing, shadows, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(150)).current; // Start hidden below screen

  useEffect(() => {
    if (visible) {
      // Slide In
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();

      // Auto Dismiss Timer
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Slide Out
      Animated.timing(slideAnim, {
        toValue: 150,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 150,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  if (!visible) return null;

  // Set colors based on snackbar type
  let backgroundColor = colors.error;
  let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'alert-circle';

  if (type === 'success') {
    backgroundColor = colors.success;
    iconName = 'check-circle';
  } else if (type === 'info') {
    backgroundColor = colors.primary;
    iconName = 'information';
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          bottom: insets.bottom > 0 ? insets.bottom + spacing.sm : spacing.lg,
        },
      ]}
    >
      <View style={[styles.content, shadows, { backgroundColor, borderRadius: borderRadius.md }]}>
        <MaterialCommunityIcons name={iconName} size={22} color="#FFFFFF" style={styles.icon} />
        
        <Text style={[styles.text, { fontSize: typography.fontSize.sm }]} numberOfLines={2}>
          {message}
        </Text>
        
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
    paddingRight: 8,
  },
  closeButton: {
    padding: 2,
  },
});
export default ErrorSnackbar;
