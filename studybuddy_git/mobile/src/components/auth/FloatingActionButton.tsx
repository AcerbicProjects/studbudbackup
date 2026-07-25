import React from 'react';
import { TouchableOpacity, StyleSheet, GestureResponderEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface FABProps {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: (event: GestureResponderEvent) => void;
  style?: any;
}

export const FloatingActionButton: React.FC<FABProps> = ({ iconName, onPress, style }) => {
  const { borderRadius, shadows } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.container, shadows, style]}
      accessibilityRole="button"
    >
      <LinearGradient
        colors={['#8B5CF6', '#4F46E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: borderRadius.round }]}
      >
        <MaterialCommunityIcons name={iconName} size={26} color="#FFFFFF" />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    zIndex: 999,
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
export default FloatingActionButton;
