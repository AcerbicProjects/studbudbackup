import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthStackParamList } from './SplashScreen';
import ThemeToggle from '../../components/auth/ThemeToggle';
import IllustrationContainer from '../../components/auth/IllustrationContainer';
import GlassCard from '../../components/auth/GlassCard';

const { width, height } = Dimensions.get('window');

interface Slide {
  id: number;
  title: string;
  description: string;
  illustrationType: 'documents' | 'brain' | 'analytics';
  floatingCard: () => React.ReactNode;
  themeColor: string;
  blobColor: string;
}

export const OnboardingScreen = () => {
  const { colors, spacing, borderRadius, typography, shadows } = useTheme();
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Floating detail cards for each page to look Behance-like
  const renderFloatingCard1 = () => (
    <GlassCard style={styles.floatingCardOverlay}>
      <View style={styles.floatingRow}>
        <View style={[styles.miniCircle, { backgroundColor: '#4F46E5' }]}>
          <MaterialCommunityIcons name="file-pdf-box" size={16} color="#FFFFFF" />
        </View>
        <View style={styles.miniTextWrapper}>
          <Text style={[styles.miniTitle, { color: colors.text }]}>Lecture_Notes.pdf</Text>
          <Text style={[styles.miniSubtitle, { color: colors.textMuted }]}>Upload Complete • 4.2 MB</Text>
        </View>
      </View>
      {/* Mini mock progress bar */}
      <View style={[styles.miniProgressContainer, { backgroundColor: colors.border }]}>
        <View style={[styles.miniProgressBar, { backgroundColor: '#22C55E', width: '100%' }]} />
      </View>
    </GlassCard>
  );

  const renderFloatingCard2 = () => (
    <GlassCard style={styles.floatingCardOverlay}>
      <View style={styles.floatingRow}>
        <View style={[styles.miniCircle, { backgroundColor: '#8B5CF6' }]}>
          <MaterialCommunityIcons name="lightning-bolt" size={16} color="#FFFFFF" />
        </View>
        <View style={styles.miniTextWrapper}>
          <Text style={[styles.miniTitle, { color: colors.text }]}>AI Flashcards</Text>
          <Text style={[styles.miniSubtitle, { color: colors.textMuted }]}>48 questions generated</Text>
        </View>
      </View>
      {/* Tags */}
      <View style={styles.tagRow}>
        <View style={[styles.tag, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
          <Text style={[styles.tagText, { color: '#22C55E' }]}>Active Recall</Text>
        </View>
        <View style={[styles.tag, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
          <Text style={[styles.tagText, { color: '#8B5CF6' }]}>AI Quiz</Text>
        </View>
      </View>
    </GlassCard>
  );

  const renderFloatingCard3 = () => (
    <GlassCard style={styles.floatingCardOverlay}>
      <View style={styles.floatingRow}>
        <View style={[styles.miniCircle, { backgroundColor: '#22C55E' }]}>
          <MaterialCommunityIcons name="trophy-outline" size={16} color="#FFFFFF" />
        </View>
        <View style={styles.miniTextWrapper}>
          <Text style={[styles.miniTitle, { color: colors.text }]}>Daily Growth</Text>
          <Text style={[styles.miniSubtitle, { color: colors.textMuted }]}>Weekly Goal reached!</Text>
        </View>
      </View>
      <Text style={[styles.statHighlight, { color: '#22C55E' }]}>+24% Recall Retention</Text>
    </GlassCard>
  );

  const slides: Slide[] = [
    {
      id: 1,
      title: 'Study Smarter',
      description: 'Upload lecture slides and handwritten notes effortlessly.',
      illustrationType: 'documents',
      floatingCard: renderFloatingCard1,
      themeColor: '#4F46E5',
      blobColor: 'rgba(79, 70, 229, 0.2)',
    },
    {
      id: 2,
      title: 'Powered by AI',
      description: 'Generate summaries, flashcards, quizzes and viva questions instantly.',
      illustrationType: 'brain',
      floatingCard: renderFloatingCard2,
      themeColor: '#8B5CF6',
      blobColor: 'rgba(139, 92, 246, 0.2)',
    },
    {
      id: 3,
      title: 'Track Your Growth',
      description: 'See analytics, weak topics and smart revision reminders.',
      illustrationType: 'analytics',
      floatingCard: renderFloatingCard3,
      themeColor: '#22C55E',
      blobColor: 'rgba(34, 197, 94, 0.2)',
    },
  ];

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * width,
        animated: true,
      });
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  // Dot indicator animations
  const renderDots = () => {
    return (
      <View style={styles.indicatorContainer}>
        {slides.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 26, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          const backgroundColor = scrollX.interpolate({
            inputRange,
            outputRange: [colors.textMuted, '#8B5CF6', colors.textMuted],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Mesh Blob behind illustration */}
      {slides.map((slide, index) => {
        const opacity = scrollX.interpolate({
          inputRange: [(index - 1) * width, index * width, (index + 1) * width],
          outputRange: [0, 0.45, 0],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={slide.id}
            style={[
              styles.meshBlob,
              {
                backgroundColor: slide.themeColor,
                opacity,
              },
            ]}
          />
        );
      })}

      {/* Header controls: Theme toggle */}
      <View style={styles.header}>
        <ThemeToggle />
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: handleScroll }
        )}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slideWidth}>
            <View style={styles.slideContainer}>
              {/* Layered illustration area with floating cards */}
              <View style={styles.illustrationWrapper}>
                <IllustrationContainer type={slide.illustrationType} size={220} />
                
                {/* Layered floating info card overlay */}
                {slide.floatingCard()}
              </View>

              {/* Text content */}
              <View style={styles.textWrapper}>
                <Text style={[styles.title, { color: colors.text, fontSize: typography.fontSize.xl + 4 }]}>
                  {slide.title}
                </Text>
                <Text style={[styles.description, { color: colors.textMuted, fontSize: typography.fontSize.md }]}>
                  {slide.description}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer Navigation */}
      <View style={[styles.footer, { paddingBottom: spacing.xl }]}>
        {renderDots()}

        <View style={styles.buttonContainer}>
          {currentIndex < slides.length - 1 ? (
            <>
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={[styles.skipText, { color: colors.textMuted, fontSize: typography.fontSize.md }]}>
                  Skip
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleNext}
                style={[styles.nextButton, { backgroundColor: colors.primary, borderRadius: borderRadius.lg }]}
              >
                <Text style={[styles.nextText, { fontSize: typography.fontSize.md }]}>
                  Next
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.getStartedButton, { backgroundColor: colors.primary, borderRadius: borderRadius.lg }]}
            >
              <Text style={[styles.getStartedText, { fontSize: typography.fontSize.md }]}>
                Get Started
              </Text>
              <MaterialCommunityIcons name="rocket-launch" size={20} color="#FFFFFF" style={styles.rocketIcon} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  meshBlob: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    filter: 'blur(45px)',
    top: height * 0.18,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 50,
    zIndex: 20,
  },
  scrollView: {
    flex: 1,
    zIndex: 10,
  },
  slideWidth: {
    width: width,
  },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  illustrationWrapper: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 48,
  },
  floatingCardOverlay: {
    position: 'absolute',
    bottom: -15,
    right: -10,
    width: 200,
    padding: 12,
    borderWidth: 1,
    borderRadius: 16,
  },
  floatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  miniCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  miniTextWrapper: {
    flex: 1,
  },
  miniTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  miniSubtitle: {
    fontSize: 9,
    fontWeight: '500',
  },
  miniProgressContainer: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  miniProgressBar: {
    height: '100%',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginRight: 6,
  },
  tagText: {
    fontSize: 8,
    fontWeight: '700',
  },
  statHighlight: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  textWrapper: {
    alignItems: 'center',
    marginTop: 16,
  },
  title: {
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 32,
    alignItems: 'center',
    zIndex: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    height: 10,
    justifyContent: 'center',
    marginBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 54,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  skipText: {
    fontWeight: '700',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 26,
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  nextText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginRight: 8,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  getStartedText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginRight: 8,
  },
  rocketIcon: {
    marginLeft: 4,
  },
});
export default OnboardingScreen;
