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
import ThemeToggle from '../../components/auth/ThemeToggle';
import ErrorSnackbar from '../../components/auth/ErrorSnackbar';
import IllustrationContainer from '../../components/auth/IllustrationContainer';
import GlassCard from '../../components/auth/GlassCard';

const { width, height } = Dimensions.get('window');

export const RegisterScreen = () => {
  const { colors, spacing, borderRadius, typography } = useTheme();
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  // Form Field States
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Field Validation Error States
  const [fullNameError, setFullNameError] = useState('');
  const [universityError, setUniversityError] = useState('');
  const [studentIdError, setStudentIdError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Field Integrity States (valid checkmarks)
  const [isFullNameValid, setIsFullNameValid] = useState(false);
  const [isUniversityValid, setIsUniversityValid] = useState(false);
  const [isStudentIdValid, setIsStudentIdValid] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'error' | 'success'>('error');

  // Input Validation Rules
  const handleFullNameChange = (text: string) => {
    setFullName(text);
    if (!text.trim()) {
      setFullNameError('Full Name is required');
      setIsFullNameValid(false);
    } else if (text.trim().length < 2) {
      setFullNameError('Name must be at least 2 characters');
      setIsFullNameValid(false);
    } else {
      setFullNameError('');
      setIsFullNameValid(true);
    }
  };

  const handleUniversityChange = (text: string) => {
    setUniversity(text);
    if (!text.trim()) {
      setUniversityError('University is required');
      setIsUniversityValid(false);
    } else {
      setUniversityError('');
      setIsUniversityValid(true);
    }
  };

  const handleStudentIdChange = (text: string) => {
    setStudentId(text);
    if (!text.trim()) {
      setStudentIdError('Student ID is required');
      setIsStudentIdValid(false);
    } else {
      setStudentIdError('');
      setIsStudentIdValid(true);
    }
  };

  const handleEmailChange = (text: string) => {
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

  const handlePasswordChange = (text: string) => {
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
      if (confirmPassword) {
        if (text !== confirmPassword) {
          setConfirmPasswordError('Passwords do not match');
          setIsConfirmPasswordValid(false);
        } else {
          setConfirmPasswordError('');
          setIsConfirmPasswordValid(true);
        }
      }
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (!text) {
      setConfirmPasswordError('Please confirm your password');
      setIsConfirmPasswordValid(false);
    } else if (text !== password) {
      setConfirmPasswordError('Passwords do not match');
      setIsConfirmPasswordValid(false);
    } else {
      setConfirmPasswordError('');
      setIsConfirmPasswordValid(true);
    }
  };

  const handleRegister = () => {
    handleFullNameChange(fullName);
    handleUniversityChange(university);
    handleStudentIdChange(studentId);
    handleEmailChange(email);
    handlePasswordChange(password);
    handleConfirmPasswordChange(confirmPassword);

    const isFormValid =
      isFullNameValid &&
      isUniversityValid &&
      isStudentIdValid &&
      isEmailValid &&
      isPasswordValid &&
      isConfirmPasswordValid;

    if (!isFormValid) {
      setSnackbarType('error');
      setSnackbarMessage('Please correct the validation errors first.');
      setSnackbarVisible(true);
      return;
    }

    if (!agreeTerms) {
      setSnackbarType('error');
      setSnackbarMessage('You must agree to the Terms & Conditions.');
      setSnackbarVisible(true);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setSnackbarType('success');
      setSnackbarMessage('Account created successfully! Redirecting...');
      setSnackbarVisible(true);

      setTimeout(() => {
        navigation.navigate('Login');
      }, 1500);
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
            width: width * 0.8,
            height: width * 0.8,
            borderRadius: (width * 0.8) / 2,
            top: 40,
            right: -60,
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
            bottom: height * 0.1,
            left: -80,
            opacity: colors.glows.cyan.includes('0.3') ? 0.2 : 0.1,
          },
        ]}
      />

      <View style={styles.themeToggleWrapper}>
        <ThemeToggle />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header Illustration */}
        <View style={styles.heroSection}>
          <IllustrationContainer type="laptop" size={170} />
        </View>

        {/* Glassmorphism Card */}
        <GlassCard style={styles.registerCard}>
          <AuthHeader
            title="Create Account"
            subtitle="Join StudyBuddy to unlock personalized learning tools"
            onBackPress={() => navigation.navigate('Login')}
          />

          <View style={styles.formContainer}>
            {/* Full Name */}
            <AuthInput
              label="Full Name"
              placeholder="Alex Morgan"
              value={fullName}
              onChangeText={handleFullNameChange}
              error={fullNameError}
              isValid={isFullNameValid}
              iconName="account-outline"
            />

            {/* University */}
            <AuthInput
              label="University"
              placeholder="Stanford University"
              value={university}
              onChangeText={handleUniversityChange}
              error={universityError}
              isValid={isUniversityValid}
              iconName="school-outline"
            />

            {/* Student ID */}
            <AuthInput
              label="Student ID"
              placeholder="SU-948271"
              value={studentId}
              onChangeText={handleStudentIdChange}
              error={studentIdError}
              isValid={isStudentIdValid}
              iconName="card-account-details-outline"
            />

            {/* Email */}
            <AuthInput
              label="Email Address"
              placeholder="alex@stanford.edu"
              value={email}
              onChangeText={handleEmailChange}
              error={emailError}
              isValid={isEmailValid}
              iconName="email-outline"
              keyboardType="email-address"
            />

            {/* Password */}
            <PasswordInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={handlePasswordChange}
              error={passwordError}
              isValid={isPasswordValid}
            />

            {/* Confirm Password */}
            <PasswordInput
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              error={confirmPasswordError}
              isValid={isConfirmPasswordValid}
              iconName="lock-check-outline"
            />

            {/* Terms checkbox */}
            <TouchableOpacity
              onPress={() => setAgreeTerms(prev => !prev)}
              style={styles.checkboxRow}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={agreeTerms ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={22}
                color={agreeTerms ? '#8B5CF6' : colors.textMuted}
              />
              <View style={styles.termsTextContainer}>
                <Text style={[styles.checkboxLabel, { color: colors.text, fontSize: typography.fontSize.sm }]}>
                  I agree to the{' '}
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>Terms & Conditions</Text>
                  {' '}and{' '}
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>Privacy Policy</Text>
                </Text>
              </View>
            </TouchableOpacity>

            {/* Submit */}
            <LoadingButton
              title="Create Account"
              onPress={handleRegister}
              isLoading={isLoading}
              style={styles.submitButton}
            />

            {/* Footer Navigation Link */}
            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: colors.textMuted, fontSize: typography.fontSize.sm }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.footerLink, { color: colors.primary, fontSize: typography.fontSize.sm }]}>
                  Sign In
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
    marginBottom: 28,
  },
  registerCard: {
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 24,
  },
  termsTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  checkboxLabel: {
    fontWeight: '600',
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontWeight: '600',
  },
  footerLink: {
    fontWeight: '800',
  },
});
export default RegisterScreen;
