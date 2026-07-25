import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashcardData } from '../../data/mockAIData';
import DifficultyChip from './DifficultyChip';

interface FlashcardProps {
    card: FlashcardData;
    onBookmarkToggle?: (id: string) => void;
}

// Tap-to-flip card using a rotateY 3D transform. Front = question, back = answer.
export const Flashcard: React.FC<FlashcardProps> = ({ card, onBookmarkToggle }) => {
    const { colors, borderRadius, typography, shadows } = useTheme();

    const flip = useRef(new Animated.Value(0)).current;
    const [flipped, setFlipped] = useState(false);

    // Reset to the front whenever a new card comes in
    useEffect(() => {
        flip.setValue(0);
        setFlipped(false);
    }, [card.id, flip]);

    const handleFlip = () => {
        Animated.spring(flip, {
            toValue: flipped ? 0 : 1,
            friction: 8,
            tension: 12,
            useNativeDriver: true,
        }).start();
        setFlipped(!flipped);
    };

    const frontRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
    const backRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
    const frontOpacity = flip.interpolate({ inputRange: [0, 0.5, 0.5001, 1], outputRange: [1, 1, 0, 0] });
    const backOpacity = flip.interpolate({ inputRange: [0, 0.4999, 0.5, 1], outputRange: [0, 0, 1, 1] });

    const faceBase = {
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderRadius: borderRadius.xl,
    };

    return (
        <TouchableOpacity activeOpacity={0.92} onPress={handleFlip} style={styles.wrapper}>
            {/* Front face — question */}
            <Animated.View
                style={[
                    styles.face,
                    faceBase,
                    shadows,
                    { opacity: frontOpacity, transform: [{ perspective: 1200 }, { rotateY: frontRotate }] },
                ]}
            >
                <View style={styles.faceHeader}>
                    <DifficultyChip difficulty={card.difficulty} size="sm" />
                    <TouchableOpacity
                        onPress={() => onBookmarkToggle?.(card.id)}
                        accessibilityRole="button"
                        accessibilityLabel="Bookmark card"
                    >
                        <MaterialCommunityIcons
                            name={card.bookmarked ? 'bookmark' : 'bookmark-outline'}
                            size={22}
                            color={card.bookmarked ? colors.secondary : colors.textMuted}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.faceBody}>
                    <Text style={[styles.question, { color: colors.text, fontSize: typography.fontSize.lg + 2 }]}>
                        {card.front}
                    </Text>
                </View>

                <View style={styles.faceFooter}>
                    <MaterialCommunityIcons name="gesture-tap" size={16} color={colors.textMuted} />
                    <Text style={[styles.hint, { color: colors.textMuted }]}>Tap to reveal answer</Text>
                </View>
            </Animated.View>

            {/* Back face — answer */}
            <Animated.View
                style={[
                    styles.face,
                    styles.faceBack,
                    faceBase,
                    shadows,
                    { opacity: backOpacity, transform: [{ perspective: 1200 }, { rotateY: backRotate }] },
                ]}
            >
                <View style={styles.faceHeader}>
                    <View style={[styles.answerBadge, { backgroundColor: `${colors.accent}1F` }]}>
                        <Text style={[styles.answerBadgeText, { color: colors.accent }]}>ANSWER</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => onBookmarkToggle?.(card.id)}
                        accessibilityRole="button"
                        accessibilityLabel="Bookmark card"
                    >
                        <MaterialCommunityIcons
                            name={card.bookmarked ? 'bookmark' : 'bookmark-outline'}
                            size={22}
                            color={card.bookmarked ? colors.secondary : colors.textMuted}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.faceBody}>
                    <Text style={[styles.answer, { color: colors.text, fontSize: typography.fontSize.md }]}>
                        {card.back}
                    </Text>
                </View>

                <View style={styles.faceFooter}>
                    <MaterialCommunityIcons name="gesture-tap" size={16} color={colors.textMuted} />
                    <Text style={[styles.hint, { color: colors.textMuted }]}>Tap to flip back</Text>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        height: 340,
        marginHorizontal: 24,
    },
    face: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderWidth: 1,
        padding: 20,
        backfaceVisibility: 'hidden',
        justifyContent: 'space-between',
    },
    faceBack: {},
    faceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faceBody: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    question: {
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 30,
    },
    answer: {
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 26,
    },
    faceFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    hint: {
        fontSize: 12,
        fontWeight: '500',
    },
    answerBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9999,
    },
    answerBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
});

export default Flashcard;
