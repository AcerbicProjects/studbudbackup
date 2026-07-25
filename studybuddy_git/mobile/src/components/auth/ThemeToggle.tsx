import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, colors } = useTheme();
  const rotateAnim = useRef(new Animated.Value(theme === 'dark' ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: theme === 'dark' ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [theme, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        styles.button,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Toggle dark mode"
    >
      <Animated.View style={{ transform: [{ rotate: rotation }] }}>
        <MaterialCommunityIcons
          name={theme === 'dark' ? 'weather-night' : 'weather-sunny'}
          size={20}
          color={theme === 'dark' ? '#8B5CF6' : '#F59E0B'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
export default ThemeToggle;
