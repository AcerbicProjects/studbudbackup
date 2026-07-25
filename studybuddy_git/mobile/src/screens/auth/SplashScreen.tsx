import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../../constants/theme';
import Logo from '../../components/auth/Logo';
import IllustrationContainer from '../../components/auth/IllustrationContainer';
export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Main: undefined;
};

const { width, height } = Dimensions.get('window');

export const SplashScreen = () => {
  const { colors, typography, spacing } = useTheme();
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const orb1Anim = useRef(new Animated.Value(0)).current;
  const orb2Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade and slide content
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating orb animations (looping)
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1Anim, { toValue: 15, duration: 2500, useNativeDriver: true }),
        Animated.timing(orb1Anim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2Anim, { toValue: -20, duration: 3000, useNativeDriver: true }),
        Animated.timing(orb2Anim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    // Navigation timeout
    const timer = setTimeout(() => {
      navigation.navigate('Onboarding');
    }, 3200);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, slideAnim, orb1Anim, orb2Anim]);

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      style={styles.container}
    >
      {/* Mesh background glows */}
      <Animated.View
        style={[
          styles.glowOrb,
          {
            backgroundColor: '#8B5CF6',
            width: width * 0.8,
            height: width * 0.8,
            borderRadius: (width * 0.8) / 2,
            top: -50,
            left: -50,
            opacity: colors.glows.purple.includes('0.3') ? 0.25 : 0.15,
            transform: [{ translateY: orb1Anim }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowOrb,
          {
            backgroundColor: '#06B6D4',
            width: width * 0.7,
            height: width * 0.7,
            borderRadius: (width * 0.7) / 2,
            bottom: height * 0.25,
            right: -100,
            opacity: colors.glows.cyan.includes('0.3') ? 0.25 : 0.15,
            transform: [{ translateY: orb2Anim }],
          },
        ]}
      />

      <View style={styles.contentContainer}>
        {/* Animated branding logo */}
        <Logo size="large" animated={true} />

        {/* Animated taglines */}
        <Animated.View
          style={[
            styles.textBlock,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={[styles.tagline, { color: colors.textMuted, fontSize: typography.fontSize.md }]}>
            "Transform Your Notes Into Knowledge"
          </Text>

          <ActivityIndicator
            size="small"
            color="#8B5CF6"
            style={[styles.loader, { marginTop: spacing.xl }]}
          />
        </Animated.View>
      </View>

      {/* Graduation illustration at the bottom */}
      <Animated.View style={[styles.bottomIllustration, { opacity: fadeAnim }]}>
        <IllustrationContainer type="graduation" size={140} />
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    filter: 'blur(45px)',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    width: '100%',
    paddingHorizontal: 32,
    marginTop: -50,
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 24,
  },
  tagline: {
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  loader: {
    transform: [{ scale: 1.2 }],
  },
  bottomIllustration: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
});
export default SplashScreen;
