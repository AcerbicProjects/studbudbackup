import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';
import { AIStackParamList } from '../../types/ai';
import Flashcard from '../../components/ai/Flashcard';
import { FlashcardData, mockFlashcards } from '../../data/mockAIData';

// Flashcards — active recall deck with flip, bookmark, shuffle and progress.
// Week 1: previous/next buttons; swipe gestures land in Week 2.
export const FlashcardsScreen: React.FC = () => {
    const { colors, borderRadius, typography } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<AIStackParamList>>();

    const [cards, setCards] = useState<FlashcardData[]>(mockFlashcards);
    const [index, setIndex] = useState(0);

    const card = cards[index];
    const progress = ((index + 1) / cards.length) * 100;

    const handleBookmarkToggle = (id: string) => {
        setCards((prev) =>
            prev.map((c) => (c.id === id ? { ...c, bookmarked: !c.bookmarked } : c))
        );
    };

    const handleShuffle = () => {
        setCards((prev) => {
            const shuffled = [...prev];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        });
        setIndex(0);
    };

    const goPrev = () => setIndex((i) => Math.max(0, i - 1));
    const goNext = () => setIndex((i) => Math.min(cards.length - 1, i + 1));

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerButton}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontSize: typography.fontSize.md }]}>
                    Flashcards
                </Text>
                <TouchableOpacity
                    onPress={handleShuffle}
                    style={styles.headerButton}
                    accessibilityRole="button"
                    accessibilityLabel="Shuffle deck"
                >
                    <MaterialCommunityIcons name="shuffle-variant" size={20} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Progress */}
            <View style={styles.progressSection}>
                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${progress}%`, backgroundColor: colors.primary },
                        ]}
                    />
                </View>
                <Text style={[styles.progressText, { color: colors.textMuted }]}>
                    Card {index + 1} of {cards.length}
                </Text>
            </View>

            {/* Card */}
            <View style={styles.cardArea}>
                <Flashcard card={card} onBookmarkToggle={handleBookmarkToggle} />
            </View>

            {/* Deck controls */}
            <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
                <TouchableOpacity
                    style={[
                        styles.navButton,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            borderRadius: borderRadius.round,
                            opacity: index === 0 ? 0.4 : 1,
                        },
                    ]}
                    onPress={goPrev}
                    disabled={index === 0}
                    accessibilityRole="button"
                    accessibilityLabel="Previous card"
                >
                    <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
                    <Text style={[styles.navLabel, { color: colors.text }]}>Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.navButton,
                        styles.navButtonPrimary,
                        {
                            backgroundColor: colors.primary,
                            borderRadius: borderRadius.round,
                            opacity: index === cards.length - 1 ? 0.4 : 1,
                        },
                    ]}
                    onPress={goNext}
                    disabled={index === cards.length - 1}
                    accessibilityRole="button"
                    accessibilityLabel="Next card"
                >
                    <Text style={[styles.navLabel, styles.navLabelPrimary]}>Next</Text>
                    <MaterialCommunityIcons name="arrow-right" size={22} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    headerButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontWeight: '700',
    },
    progressSection: {
        paddingHorizontal: 24,
        paddingTop: 20,
        gap: 8,
    },
    progressTrack: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    cardArea: {
        flex: 1,
        justifyContent: 'center',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 24,
        gap: 14,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        paddingHorizontal: 26,
        paddingVertical: 14,
        flex: 1,
    },
    navButtonPrimary: {
        borderWidth: 0,
    },
    navLabel: {
        fontSize: 15,
        fontWeight: '700',
    },
    navLabelPrimary: {
        color: '#FFFFFF',
    },
});

export default FlashcardsScreen;
