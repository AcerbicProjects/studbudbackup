import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LogoProps {
  size?: 'small' | 'large';
  animated?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'small', animated = true }) => {
  const { colors, typography, spacing } = useTheme();

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Continuous rotation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [animated, pulseAnim, rotateAnim]);

  const isLarge = size === 'large';
  const iconSize = isLarge ? 64 : 32;

  // Interpolate rotation
  const spinClockwise = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinCounterClockwise = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.logoBadgeContainer}>
        {/* Animated outer dashed orbit ring */}
        {animated && (
          <Animated.View
            style={[
              styles.orbitRing,
              {
                width: iconSize * 2,
                height: iconSize * 2,
                borderRadius: iconSize,
                borderColor: '#8B5CF6',
                transform: [{ rotate: spinClockwise }],
              },
            ]}
          />
        )}

        {/* Animated inner dashed orbit ring */}
        {animated && (
          <Animated.View
            style={[
              styles.orbitRing,
              styles.orbitRingInner,
              {
                width: iconSize * 1.6,
                height: iconSize * 1.6,
                borderRadius: iconSize * 0.8,
                borderColor: '#06B6D4',
                transform: [{ rotate: spinCounterClockwise }],
              },
            ]}
          />
        )}

        {/* Central pulsing core badge */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View style={[styles.iconContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons 
              name="school-outline" 
              size={iconSize} 
              color="#4F46E5" 
            />
            <View style={styles.sparklePosition}>
              <MaterialCommunityIcons 
                name={"sparkles" as any} 
                size={iconSize * 0.4} 
                color="#8B5CF6" 
              />
            </View>
          </View>
        </Animated.View>
      </View>
      
      <Text style={[
        styles.title, 
        { 
          color: colors.text, 
          fontSize: isLarge ? typography.fontSize.h1 : typography.fontSize.xl,
          marginTop: isLarge ? spacing.md : spacing.sm 
        }
      ]}>
        Study<Text style={{ color: '#8B5CF6' }}>Buddy</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    opacity: 0.4,
  },
  orbitRingInner: {
    borderStyle: 'dotted',
    opacity: 0.6,
  },
  iconContainer: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sparklePosition: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  title: {
    fontWeight: '900',
    letterSpacing: -0.8,
  },
});
export default Logo;
