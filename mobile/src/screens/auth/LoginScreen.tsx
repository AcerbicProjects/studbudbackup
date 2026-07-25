import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, Modal, TextInput, Image, ActivityIndicator } from 'react-native';
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
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

export const LoginScreen = () => {
  const { colors, spacing, borderRadius, typography, shadows, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const { login, googleLogin } = useAuth();

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

  // Google Sign-In States
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [googleLoadingAccount, setGoogleLoadingAccount] = useState<string | null>(null);
  const [customEmailMode, setCustomEmailMode] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  const handleGoogleLoginSelect = async (account: {
    email: string;
    fullName: string;
    googleId: string;
    profilePhoto?: string;
  }) => {
    setGoogleLoadingAccount(account.email);
    try {
      await googleLogin(account);
      setGoogleModalVisible(false);
      setSnackbarType('success');
      setSnackbarMessage('Google Sign-In successful!');
      setSnackbarVisible(true);
    } catch (err: any) {
      setSnackbarType('error');
      setSnackbarMessage(err.message || 'Google Sign-In failed.');
      setSnackbarVisible(true);
    } finally {
      setGoogleLoadingAccount(null);
    }
  };

  const handleCustomGoogleSubmit = async () => {
    if (!customEmail || !customEmail.includes('@')) {
      setSnackbarType('error');
      setSnackbarMessage('Please enter a valid Google email address.');
      setSnackbarVisible(true);
      return;
    }
    const name = customName || customEmail.split('@')[0];
    await handleGoogleLoginSelect({
      email: customEmail.toLowerCase(),
      fullName: name,
      googleId: String(Date.now()),
      profilePhoto: '',
    });
  };

  const handleLogin = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      setIsEmailValid(false);
      return;
    }
    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      setIsPasswordValid(false);
      return;
    }

    setIsLoading(true);
    try {
      await login(email.toLowerCase(), password);
      setSnackbarType('success');
      setSnackbarMessage('Successfully logged in! Welcome back.');
      setSnackbarVisible(true);
    } catch (err: any) {
      setSnackbarType('error');
      setSnackbarMessage(err.message || 'Invalid email or password. Please try again.');
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
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
              onPress={() => setGoogleModalVisible(true)}
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

      {/* Google Sign In Modal */}
      <Modal
        visible={googleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setGoogleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.googleModalContainer, { backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF' }]}>
            {/* Close Button */}
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setGoogleModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={isDark ? '#F8FAFC' : '#0F172A'} />
            </TouchableOpacity>

            {/* Google Branding Header */}
            <View style={styles.googleLogoContainer}>
              <Text style={styles.googleLogoText}>
                <Text style={{ color: '#4285F4' }}>G</Text>
                <Text style={{ color: '#EA4335' }}>o</Text>
                <Text style={{ color: '#FBBC05' }}>o</Text>
                <Text style={{ color: '#4285F4' }}>g</Text>
                <Text style={{ color: '#34A853' }}>l</Text>
                <Text style={{ color: '#EA4335' }}>e</Text>
              </Text>
              <Text style={[styles.googleTitle, { color: isDark ? '#FFFFFF' : '#202124' }]}>
                Sign in
              </Text>
              <Text style={[styles.googleSubtitle, { color: isDark ? '#9AA0A6' : '#5F6368' }]}>
                to continue to StudyBuddy
              </Text>
            </View>

            {!customEmailMode ? (
              <ScrollView style={styles.googleAccountsList} showsVerticalScrollIndicator={false}>
                <Text style={[styles.chooseAccountHeader, { color: isDark ? '#E8EAED' : '#3C4043' }]}>
                  Choose an account
                </Text>

                {/* Account 1 */}
                <TouchableOpacity
                  style={[styles.accountItem, { borderColor: isDark ? '#3C4043' : '#DADCE0' }]}
                  onPress={() => handleGoogleLoginSelect({
                    email: 'samrony1212@gmail.com',
                    fullName: 'Tashin Tahir',
                    googleId: '1092847291048201',
                    profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
                  })}
                  disabled={googleLoadingAccount !== null}
                >
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' }}
                    style={styles.accountAvatar}
                  />
                  <View style={styles.accountDetails}>
                    <Text style={[styles.accountName, { color: isDark ? '#E8EAED' : '#3C4043' }]}>Tashin Tahir</Text>
                    <Text style={[styles.accountEmail, { color: isDark ? '#9AA0A6' : '#5F6368' }]}>samrony1212@gmail.com</Text>
                  </View>
                  {googleLoadingAccount === 'samrony1212@gmail.com' ? (
                    <ActivityIndicator size="small" color="#4285F4" />
                  ) : (
                    <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? '#9AA0A6' : '#5F6368'} />
                  )}
                </TouchableOpacity>

                {/* Account 2 */}
                <TouchableOpacity
                  style={[styles.accountItem, { borderColor: isDark ? '#3C4043' : '#DADCE0' }]}
                  onPress={() => handleGoogleLoginSelect({
                    email: 'guest.user@gmail.com',
                    fullName: 'Guest User',
                    googleId: '1092847291048202',
                    profilePhoto: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
                  })}
                  disabled={googleLoadingAccount !== null}
                >
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80' }}
                    style={styles.accountAvatar}
                  />
                  <View style={styles.accountDetails}>
                    <Text style={[styles.accountName, { color: isDark ? '#E8EAED' : '#3C4043' }]}>Guest User</Text>
                    <Text style={[styles.accountEmail, { color: isDark ? '#9AA0A6' : '#5F6368' }]}>guest.user@gmail.com</Text>
                  </View>
                  {googleLoadingAccount === 'guest.user@gmail.com' ? (
                    <ActivityIndicator size="small" color="#4285F4" />
                  ) : (
                    <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? '#9AA0A6' : '#5F6368'} />
                  )}
                </TouchableOpacity>

                {/* Use Another Account Button */}
                <TouchableOpacity
                  style={[styles.accountItem, { borderColor: isDark ? '#3C4043' : '#DADCE0' }]}
                  onPress={() => setCustomEmailMode(true)}
                  disabled={googleLoadingAccount !== null}
                >
                  <View style={[styles.useOtherIconWrapper, { backgroundColor: isDark ? '#3C4043' : '#F1F3F4' }]}>
                    <MaterialCommunityIcons name="account-plus-outline" size={20} color={isDark ? '#E8EAED' : '#5F6368'} />
                  </View>
                  <Text style={[styles.useOtherText, { color: '#4285F4' }]}>
                    Use another account
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={styles.customEmailContainer}>
                <TouchableOpacity style={styles.backToAccounts} onPress={() => setCustomEmailMode(false)}>
                  <MaterialCommunityIcons name="arrow-left" size={20} color="#4285F4" />
                  <Text style={styles.backToAccountsText}>Choose account</Text>
                </TouchableOpacity>

                <Text style={[styles.inputLabel, { color: isDark ? '#E8EAED' : '#3C4043' }]}>
                  Enter your Google Email
                </Text>
                <TextInput
                  style={[styles.googleInput, {
                    color: isDark ? '#FFFFFF' : '#000000',
                    borderColor: isDark ? '#3C4043' : '#DADCE0',
                    backgroundColor: isDark ? '#2D2D2D' : '#F1F3F4',
                  }]}
                  placeholder="username@gmail.com"
                  placeholderTextColor={isDark ? '#80868B' : '#5F6368'}
                  value={customEmail}
                  onChangeText={setCustomEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={[styles.inputLabel, { color: isDark ? '#E8EAED' : '#3C4043', marginTop: 16 }]}>
                  Name (optional)
                </Text>
                <TextInput
                  style={[styles.googleInput, {
                    color: isDark ? '#FFFFFF' : '#000000',
                    borderColor: isDark ? '#3C4043' : '#DADCE0',
                    backgroundColor: isDark ? '#2D2D2D' : '#F1F3F4',
                  }]}
                  placeholder="Google User"
                  placeholderTextColor={isDark ? '#80868B' : '#5F6368'}
                  value={customName}
                  onChangeText={setCustomName}
                />

                <TouchableOpacity
                  style={styles.googleSubmitButton}
                  onPress={handleCustomGoogleSubmit}
                  disabled={googleLoadingAccount !== null}
                >
                  {googleLoadingAccount !== null ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.googleSubmitButtonText}>Next</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Modal Footer */}
            <View style={styles.googleFooter}>
              <Text style={[styles.googleFooterDisclaimer, { color: isDark ? '#9AA0A6' : '#5F6368' }]}>
                To continue, Google will share your name, email address, language preference, and profile picture with StudyBuddy.
              </Text>
              <View style={styles.googleFooterLinks}>
                <Text style={styles.googleFooterLinkText}>Help</Text>
                <Text style={styles.googleFooterLinkText}>Privacy</Text>
                <Text style={styles.googleFooterLinkText}>Terms</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  googleModalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 8,
    paddingVertical: 36,
    paddingHorizontal: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 10,
  },
  googleLogoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  googleLogoText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-medium',
    marginBottom: 16,
  },
  googleTitle: {
    fontSize: 22,
    fontWeight: '400',
    marginBottom: 4,
  },
  googleSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  googleAccountsList: {
    width: '100%',
    maxHeight: 280,
    marginBottom: 20,
  },
  chooseAccountHeader: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    marginTop: 4,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  accountAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
  },
  accountEmail: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  useOtherIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  useOtherText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  customEmailContainer: {
    width: '100%',
    marginBottom: 24,
  },
  backToAccounts: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backToAccountsText: {
    color: '#4285F4',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  googleInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  googleSubmitButton: {
    backgroundColor: '#4285F4',
    height: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  googleSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  googleFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DADCE0',
    paddingTop: 16,
    marginTop: 12,
  },
  googleFooterDisclaimer: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'left',
    marginBottom: 16,
  },
  googleFooterLinks: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  googleFooterLinkText: {
    fontSize: 11,
    color: '#4285F4',
    marginRight: 16,
    fontWeight: '600',
  },
});
export default LoginScreen;
