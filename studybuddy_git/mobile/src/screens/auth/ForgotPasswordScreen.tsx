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
import LoadingButton from '../../components/auth/LoadingButton';
import ThemeToggle from '../../components/auth/ThemeToggle';
import ErrorSnackbar from '../../components/auth/ErrorSnackbar';
import IllustrationContainer from '../../components/auth/IllustrationContainer';
import GlassCard from '../../components/auth/GlassCard';

const { width, height } = Dimensions.get('window');

export const ForgotPasswordScreen = () => {
  const { colors, spacing, borderRadius, typography, shadows } = useTheme();
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  // Form State
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);

  // Flow States
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Snackbar Alert States
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

  const handleSendLink = () => {
    validateEmail(email);

    if (!isEmailValid || !email) {
      setSnackbarType('error');
      setSnackbarMessage('Please enter a valid email address first.');
      setSnackbarVisible(true);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      if (email.toLowerCase() === 'error@studybuddy.com') {
        setSnackbarType('error');
        setSnackbarMessage('This email address is not registered in our system.');
        setSnackbarVisible(true);
      } else {
        setIsSubmitted(true);
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
            right: -40,
            opacity: colors.glows.purple.includes('0.3') ? 0.2 : 0.1,
          },
        ]}
      />
      <View
        style={[
          styles.glowBlob,
          {
            backgroundColor: '#06B6D4',
            width: width * 0.7,
            height: width * 0.7,
            borderRadius: (width * 0.7) / 2,
            bottom: height * 0.15,
            left: -40,
            opacity: colors.glows.cyan.includes('0.3') ? 0.2 : 0.1,
          },
        ]}
      />

      <View style={styles.themeToggleWrapper}>
        <ThemeToggle />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {!isSubmitted ? (
          <>
            {/* Header Illustration */}
            <View style={styles.heroSection}>
              <IllustrationContainer type="scan" size={170} />
            </View>

            {/* Glassmorphism Centered Card */}
            <GlassCard style={styles.card}>
              <AuthHeader
                title="Reset Password"
                subtitle="Enter your email to receive a password recovery link"
                onBackPress={() => navigation.navigate('Login')}
              />

              <View style={styles.formContainer}>
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

                <LoadingButton
                  title="Send Reset Link"
                  onPress={handleSendLink}
                  isLoading={isLoading}
                  style={styles.submitButton}
                />

                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  style={styles.backLink}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="arrow-left" size={16} color={colors.primary} style={styles.backIcon} />
                  <Text style={[styles.backLinkText, { color: colors.primary, fontSize: typography.fontSize.sm }]}>
                    Back to Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </>
        ) : (
          <View style={styles.successContainer}>
            <GlassCard style={[styles.successCard, shadows]}>
              {/* Success Badge */}
              <View style={[styles.successIconWrapper, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <MaterialCommunityIcons name="email-check-outline" size={48} color={colors.success} />
              </View>

              <Text style={[styles.successTitle, { color: colors.text, fontSize: typography.fontSize.xl }]}>
                Reset Link Sent!
              </Text>
              
              <Text style={[styles.successDescription, { color: colors.textMuted, fontSize: typography.fontSize.md }]}>
                We've sent a recovery email to{' '}
                <Text style={{ fontWeight: '700', color: colors.text }}>{email}</Text>.
                Please click the link inside to set up a new password.
              </Text>

              <LoadingButton
                title="Back to Login"
                onPress={() => navigation.navigate('Login')}
                isLoading={false}
                style={styles.cardButton}
              />

              <TouchableOpacity
                onPress={() => setIsSubmitted(false)}
                style={styles.resendContainer}
                activeOpacity={0.7}
              >
                <Text style={[styles.resendText, { color: colors.textMuted, fontSize: typography.fontSize.sm }]}>
                  Didn't receive email?{' '}
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>Try again</Text>
                </Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        )}
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
    flexGrow: 1,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  card: {
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
  submitButton: {
    marginTop: 8,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  backIcon: {
    marginRight: 6,
  },
  backLinkText: {
    fontWeight: '700',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingTop: 40,
  },
  successCard: {
    width: '100%',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  successIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
  },
  successDescription: {
    fontWeight: '400',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  cardButton: {
    width: '100%',
  },
  resendContainer: {
    marginTop: 16,
    padding: 8,
  },
  resendText: {
    fontWeight: '600',
  },
});
export default ForgotPasswordScreen;
