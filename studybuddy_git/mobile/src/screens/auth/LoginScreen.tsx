import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthStackParamList } from './SplashScreen';

// Import Reusable Components
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import PasswordInput from '../../components/auth/PasswordInput';
import LoadingButton from '../../components/auth/LoadingButton';
import { SocialLoginButton } from '../../components/auth/PrimaryButton';
import ThemeToggle from '../../components/auth/ThemeToggle';
import ErrorSnackbar from '../../components/auth/ErrorSnackbar';
import IllustrationContainer from '../../components/auth/IllustrationContainer';
import GlassCard from '../../components/auth/GlassCard';

const { width, height } = Dimensions.get('window');

export const LoginScreen = () => {
  const { colors, spacing, borderRadius, typography, shadows } = useTheme();
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Validation States
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'error' | 'success'>('error');

  const validateEmail = (text: string) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text) {
      setEmailError('Email is required');
      setIsEmailValid(false);
    } else if (!emailRegex.test(text)) {
      setEmailError('Please enter a valid email address');
      setIsEmailValid(false);
    } else {
      setEmailError('');
      setIsEmailValid(true);
    }
  };

  const validatePassword = (text: string) => {
    setPassword(text);
    if (!text) {
      setPasswordError('Password is required');
      setIsPasswordValid(false);
    } else if (text.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      setIsPasswordValid(false);
    } else {
      setPasswordError('');
      setIsPasswordValid(true);
    }
  };

  const handleLogin = () => {
    validateEmail(email);
    validatePassword(password);

    if (!isEmailValid || !isPasswordValid || !email || !password) {
      setSnackbarType('error');
      setSnackbarMessage('Please correct the validation errors first.');
      setSnackbarVisible(true);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      if (email.toLowerCase() === 'error@studybuddy.com') {
        setSnackbarType('error');
        setSnackbarMessage('Invalid email or password. Please try again.');
        setSnackbarVisible(true);
      } else {
        setSnackbarType('success');
        setSnackbarMessage('Successfully logged in! Welcome back.');
        setSnackbarVisible(true);
        setTimeout(() => {
          setEmail('');
          setPassword('');
          setIsEmailValid(false);
          setIsPasswordValid(false);
          navigation.navigate('Main');
        }, 1000);
      }
    }, 2000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <LinearGradient
        colors={colors.backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      {/* Abstract Glowing Mesh Blobs */}
      <View
        style={[
          styles.glowBlob,
          {
            backgroundColor: '#8B5CF6',
            width: width * 0.7,
            height: width * 0.7,
            borderRadius: (width * 0.7) / 2,
            top: height * 0.1,
            left: -50,
            opacity: colors.glows.purple.includes('0.3') ? 0.2 : 0.1,
          },
        ]}
      />
      <View
        style={[
          styles.glowBlob,
          {
            backgroundColor: '#06B6D4',
            width: width * 0.6,
            height: width * 0.6,
            borderRadius: (width * 0.6) / 2,
            bottom: height * 0.2,
            right: -60,
            opacity: colors.glows.cyan.includes('0.3') ? 0.2 : 0.1,
          },
        ]}
      />

      <View style={styles.themeToggleWrapper}>
        <ThemeToggle />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Large Hero Illustration */}
        <View style={styles.heroSection}>
          <IllustrationContainer type="ai-assistant" size={190} />
        </View>

        {/* Glassmorphism Card Wrapper */}
        <GlassCard style={styles.loginCard}>
          <AuthHeader
            title="Welcome Back"
            subtitle="Sign in to resume notes synthesis and AI quizzes"
          />

          <View style={styles.formContainer}>
            {/* Email input */}
            <AuthInput
              label="Email Address"
              placeholder="student@university.edu"
              value={email}
              onChangeText={validateEmail}
              error={emailError}
              isValid={isEmailValid}
              iconName="email-outline"
              keyboardType="email-address"
            />

            {/* Password Input */}
            <PasswordInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={validatePassword}
              error={passwordError}
              isValid={isPasswordValid}
            />

            {/* Remember Me and Forgot Password links */}
            <View style={styles.row}>
              <TouchableOpacity
                onPress={() => setRememberMe(prev => !prev)}
                style={styles.checkboxContainer}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={rememberMe ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={22}
                  color={rememberMe ? '#8B5CF6' : colors.textMuted}
                />
                <Text style={[styles.checkboxLabel, { color: colors.text, fontSize: typography.fontSize.sm }]}>
                  Remember Me
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={[styles.forgotText, { color: colors.primary, fontSize: typography.fontSize.sm }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <LoadingButton
              title="Sign In"
              onPress={handleLogin}
              isLoading={isLoading}
              style={styles.submitButton}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted, fontSize: typography.fontSize.xs }]}>
                OR
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Social Sign In */}
            <SocialLoginButton
              provider="google"
              onPress={() => {
                setSnackbarType('success');
                setSnackbarMessage('Google Sign-In UI requested.');
                setSnackbarVisible(true);
              }}
              style={styles.socialButton}
            />

            {/* Footer Navigation Link */}
            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: colors.textMuted, fontSize: typography.fontSize.sm }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={[styles.footerLink, { color: colors.primary, fontSize: typography.fontSize.sm }]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Snackbar Alert */}
      <ErrorSnackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  glowBlob: {
    position: 'absolute',
    filter: 'blur(45px)',
  },
  themeToggleWrapper: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 20,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  loginCard: {
    borderWidth: 1,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  formContainer: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontWeight: '600',
  },
  forgotText: {
    fontWeight: '700',
  },
  submitButton: {
    marginTop: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  socialButton: {
    marginBottom: 24,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontWeight: '600',
  },
  footerLink: {
    fontWeight: '800',
  },
});
export default LoginScreen;
