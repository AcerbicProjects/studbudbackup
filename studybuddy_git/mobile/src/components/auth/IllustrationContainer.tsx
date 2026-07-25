import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export type IllustrationType = 
  | 'ai-assistant' 
  | 'brain' 
  | 'laptop' 
  | 'analytics' 
  | 'documents' 
  | 'graduation' 
  | 'books' 
  | 'scan'
  | 'flashcards';

interface IllustrationProps {
  type: IllustrationType;
  size?: number;
}

export const IllustrationContainer: React.FC<IllustrationProps> = ({ type, size = 180 }) => {
  const { colors, isDark } = useTheme();

  // Common wrapper size
  const containerStyle = {
    width: size,
    height: size,
  };

  const renderAIAssistant = () => (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Mesh glowing blobs */}
      <View style={[styles.glowBlob, { backgroundColor: '#8B5CF6', opacity: 0.2, width: size * 0.9, height: size * 0.9 }]} />
      <View style={[styles.glowBlob, { backgroundColor: '#06B6D4', opacity: 0.15, width: size * 0.7, height: size * 0.7, left: 10, top: 20 }]} />
      
      {/* Concentric rings */}
      <View style={[styles.ring, { width: size * 0.7, height: size * 0.7, borderColor: 'rgba(139, 92, 246, 0.3)' }]} />
      <View style={[styles.ring, { width: size * 0.5, height: size * 0.5, borderColor: 'rgba(6, 182, 212, 0.4)' }]} />
      
      {/* Central Core */}
      <LinearGradient
        colors={['#8B5CF6', '#4F46E5']}
        style={[styles.core, { width: size * 0.3, height: size * 0.3, borderRadius: (size * 0.3) / 2 }]}
      >
        <MaterialCommunityIcons name="robot" size={size * 0.15} color="#FFFFFF" />
      </LinearGradient>

      {/* Floating Sparkles */}
      <View style={[styles.sparkle, { top: '15%', right: '20%' }]}>
        <MaterialCommunityIcons name={"sparkles" as any} size={size * 0.12} color="#22C55E" />
      </View>
      <View style={[styles.sparkle, { bottom: '20%', left: '15%' }]}>
        <MaterialCommunityIcons name="star-four-points" size={size * 0.08} color="#F59E0B" />
      </View>
    </View>
  );

  const renderBrain = () => (
    <View style={[styles.wrapper, containerStyle]}>
      <View style={[styles.glowBlob, { backgroundColor: '#EC4899', opacity: 0.15, width: size * 0.8, height: size * 0.8 }]} />
      <View style={[styles.glowBlob, { backgroundColor: '#8B5CF6', opacity: 0.2, width: size * 0.6, height: size * 0.6 }]} />
      
      <LinearGradient
        colors={['#8B5CF6', '#EC4899']}
        style={[styles.roundedBox, { width: size * 0.45, height: size * 0.45, borderRadius: 28 }]}
      >
        <MaterialCommunityIcons name="brain" size={size * 0.22} color="#FFFFFF" />
      </LinearGradient>

      <View style={[styles.sparkle, { top: '10%', left: '20%' }]}>
        <MaterialCommunityIcons name={"sparkles" as any} size={22} color="#06B6D4" />
      </View>
    </View>
  );

  const renderLaptop = () => (
    <View style={[styles.wrapper, containerStyle]}>
      <View style={[styles.glowBlob, { backgroundColor: '#4F46E5', opacity: 0.15, width: size * 0.9, height: size * 0.8 }]} />
      
      <View style={[styles.laptopBody, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="laptop" size={size * 0.45} color={colors.text} />
        <View style={styles.laptopBrainOverlay}>
          <MaterialCommunityIcons name="brain" size={size * 0.14} color="#8B5CF6" />
        </View>
      </View>
    </View>
  );

  const renderAnalytics = () => (
    <View style={[styles.wrapper, containerStyle]}>
      <View style={[styles.glowBlob, { backgroundColor: '#22C55E', opacity: 0.15, width: size * 0.9, height: size * 0.9 }]} />
      
      <View style={[styles.graphCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.barRow}>
          <View style={[styles.bar, { height: '30%', backgroundColor: colors.border }]} />
          <View style={[styles.bar, { height: '55%', backgroundColor: '#8B5CF6' }]} />
          <View style={[styles.bar, { height: '80%', backgroundColor: '#22C55E' }]} />
          <View style={[styles.bar, { height: '65%', backgroundColor: '#4F46E5' }]} />
        </View>
        <View style={styles.chartTrend}>
          <MaterialCommunityIcons name="trending-up" size={24} color="#22C55E" />
        </View>
      </View>
    </View>
  );

  const renderDocuments = () => (
    <View style={[styles.wrapper, containerStyle]}>
      <View style={[styles.glowBlob, { backgroundColor: '#3B82F6', opacity: 0.15, width: size * 0.9, height: size * 0.9 }]} />
      
      <View style={[styles.docBack, { backgroundColor: colors.border }]} />
      <View style={[styles.docFront, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="file-document-outline" size={size * 0.28} color="#4F46E5" />
        <View style={[styles.docUploadIcon, { backgroundColor: '#8B5CF6' }]}>
          <MaterialCommunityIcons name="arrow-up" size={16} color="#FFFFFF" />
        </View>
      </View>
    </View>
  );

  const renderGraduation = () => (
    <View style={[styles.wrapper, containerStyle]}>
      <View style={[styles.glowBlob, { backgroundColor: '#4F46E5', opacity: 0.15, width: size * 0.9, height: size * 0.9 }]} />
      
      <LinearGradient
        colors={['#4F46E5', '#8B5CF6']}
        style={[styles.roundedBox, { width: size * 0.45, height: size * 0.45, borderRadius: 28 }]}
      >
        <MaterialCommunityIcons name="school" size={size * 0.25} color="#FFFFFF" />
      </LinearGradient>
      
      <View style={[styles.sparkle, { top: '15%', right: '15%' }]}>
        <MaterialCommunityIcons name={"sparkles" as any} size={24} color="#F59E0B" />
      </View>
    </View>
  );

  const renderBooks = () => (
    <View style={[styles.wrapper, containerStyle]}>
      <View style={[styles.glowBlob, { backgroundColor: '#F59E0B', opacity: 0.12, width: size * 0.9, height: size * 0.9 }]} />
      
      <View style={[styles.bookStack]}>
        <View style={[styles.bookItem, { backgroundColor: '#4F46E5', transform: [{ rotate: '-10deg' }, { translateY: 10 }] }]} />
        <View style={[styles.bookItem, { backgroundColor: '#8B5CF6', transform: [{ rotate: '5deg' }] }]} />
        <View style={[styles.bookItem, { backgroundColor: '#22C55E', transform: [{ translateY: -10 }] }]}>
          <MaterialCommunityIcons name="book-open-page-variant-outline" size={size * 0.18} color="#FFFFFF" />
        </View>
      </View>
    </View>
  );

  const renderScan = () => (
    <View style={[styles.wrapper, containerStyle]}>
      <View style={[styles.glowBlob, { backgroundColor: '#06B6D4', opacity: 0.15, width: size * 0.9, height: size * 0.9 }]} />
      
      <View style={[styles.scanFrame, { borderColor: colors.border }]}>
        <MaterialCommunityIcons name="camera-outline" size={size * 0.24} color={colors.text} />
        {/* Scanning horizontal laser line */}
        <LinearGradient
          colors={['rgba(34, 197, 94, 0)', 'rgba(34, 197, 94, 0.8)', 'rgba(34, 197, 94, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.laserLine}
        />
      </View>
    </View>
  );

  const renderFlashcards = () => (
    <View style={[styles.wrapper, containerStyle]}>
      <View style={[styles.glowBlob, { backgroundColor: '#8B5CF6', opacity: 0.15, width: size * 0.9, height: size * 0.9 }]} />
      
      <View style={[styles.cardStack]}>
        <View style={[styles.cardItem, { backgroundColor: colors.border, transform: [{ rotate: '-8deg' }] }]} />
        <View style={[styles.cardItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="cards-outline" size={size * 0.22} color="#8B5CF6" />
        </View>
      </View>
    </View>
  );

  switch (type) {
    case 'ai-assistant': return renderAIAssistant();
    case 'brain': return renderBrain();
    case 'laptop': return renderLaptop();
    case 'analytics': return renderAnalytics();
    case 'documents': return renderDocuments();
    case 'graduation': return renderGraduation();
    case 'books': return renderBooks();
    case 'scan': return renderScan();
    case 'flashcards': return renderFlashcards();
    default: return renderAIAssistant();
  }
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowBlob: {
    position: 'absolute',
    borderRadius: 9999,
    filter: 'blur(30px)',
  },
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  core: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  sparkle: {
    position: 'absolute',
  },
  roundedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  laptopBody: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  laptopBrainOverlay: {
    position: 'absolute',
    top: '25%',
  },
  graphCard: {
    width: 140,
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'flex-end',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    width: '100%',
  },
  bar: {
    width: 16,
    borderRadius: 4,
  },
  chartTrend: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  docBack: {
    position: 'absolute',
    width: 80,
    height: 110,
    borderRadius: 12,
    transform: [{ rotate: '-10deg' }, { translateX: -10 }],
    opacity: 0.5,
  },
  docFront: {
    width: 90,
    height: 120,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  docUploadIcon: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bookStack: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookItem: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 110,
    height: 110,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  laserLine: {
    position: 'absolute',
    width: '100%',
    height: 3,
    top: '50%',
  },
  cardStack: {
    width: 100,
    height: 100,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardItem: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default IllustrationContainer;
