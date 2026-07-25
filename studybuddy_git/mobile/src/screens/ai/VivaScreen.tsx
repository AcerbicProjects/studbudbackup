import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';
import { AIStackParamList } from '../../types/ai';
import DifficultyChip from '../../components/ai/DifficultyChip';
import { VivaQuestion, mockVivaQuestions } from '../../data/mockAIData';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Confidence = 'low' | 'medium' | 'high';

const CONFIDENCE_OPTIONS: { key: Confidence; label: string; icon: string; color: string }[] = [
    { key: 'low', label: 'Not sure', icon: 'emoticon-confused-outline', color: '#EF4444' },
    { key: 'medium', label: 'Almost', icon: 'emoticon-neutral-outline', color: '#F59E0B' },
    { key: 'high', label: 'Nailed it', icon: 'emoticon-excited-outline', color: '#22C55E' },
];

// Viva Preparation — oral exam practice. Read the question aloud, answer it
// yourself, reveal the model answer, then rate your confidence.
export const VivaScreen: React.FC = () => {
    const { colors, borderRadius, typography, shadows } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<AIStackParamList>>();

    const [questions, setQuestions] = useState<VivaQuestion[]>(mockVivaQuestions);
    const [index, setIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [confidence, setConfidence] = useState<Record<string, Confidence>>({});

    const question = questions[index];
    const isLast = index === questions.length - 1;

    const handleReveal = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setRevealed(true);
    };

    const handleNext = () => {
        if (isLast) return;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIndex((i) => i + 1);
        setRevealed(false);
    };

    const handleBookmarkToggle = () => {
        setQuestions((prev) =>
            prev.map((q) => (q.id === question.id ? { ...q, bookmarked: !q.bookmarked } : q))
        );
    };

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
                    Viva Preparation
                </Text>
                <TouchableOpacity
                    onPress={handleBookmarkToggle}
                    style={styles.headerButton}
                    accessibilityRole="button"
                    accessibilityLabel="Bookmark question"
                >
                    <MaterialCommunityIcons
                        name={question.bookmarked ? 'bookmark' : 'bookmark-outline'}
                        size={22}
                        color={question.bookmarked ? colors.secondary : colors.textMuted}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
            >
                {/* Progress pills */}
                <View style={styles.pillsRow}>
                    {questions.map((q, i) => (
                        <View
                            key={q.id}
                            style={[
                                styles.pill,
                                {
                                    backgroundColor:
                                        i < index
                                            ? colors.accent
                                            : i === index
                                            ? colors.primary
                                            : colors.border,
                                },
                            ]}
                        />
                    ))}
                </View>
                <Text style={[styles.counter, { color: colors.textMuted }]}>
                    Question {index + 1} of {questions.length}
                </Text>

                {/* Question card */}
                <View
                    style={[
                        styles.questionCard,
                        shadows,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            borderRadius: borderRadius.xl,
                        },
                    ]}
                >
                    <View style={styles.questionHeader}>
                        <View style={[styles.examinerIcon, { backgroundColor: `${colors.primary}1A` }]}>
                            <MaterialCommunityIcons name="account-tie" size={20} color={colors.primary} />
                        </View>
                        <Text style={[styles.examinerLabel, { color: colors.textMuted }]}>EXAMINER ASKS</Text>
                        <DifficultyChip difficulty={question.difficulty} size="sm" />
                    </View>

                    <Text style={[styles.questionText, { color: colors.text, fontSize: typography.fontSize.lg }]}>
                        {question.question}
                    </Text>

                    {/* Model answer */}
                    {revealed ? (
                        <View
                            style={[
                                styles.answerBox,
                                { backgroundColor: colors.inputBg, borderRadius: borderRadius.md },
                            ]}
                        >
                            <View style={styles.answerHeader}>
                                <MaterialCommunityIcons name="check-decagram-outline" size={16} color={colors.accent} />
                                <Text style={[styles.answerLabel, { color: colors.accent }]}>MODEL ANSWER</Text>
                            </View>
                            <Text
                                style={[
                                    styles.answerText,
                                    { color: colors.text, fontSize: typography.fontSize.sm + 1 },
                                ]}
                            >
                                {question.answer}
                            </Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.revealButton,
                                { borderColor: colors.primary, borderRadius: borderRadius.round },
                            ]}
                            onPress={handleReveal}
                            accessibilityRole="button"
                            accessibilityLabel="Reveal answer"
                        >
                            <MaterialCommunityIcons name="eye-outline" size={18} color={colors.primary} />
                            <Text style={[styles.revealText, { color: colors.primary }]}>
                                Reveal Answer
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Confidence rating — appears after reveal */}
                {revealed && (
                    <View style={styles.confidenceSection}>
                        <Text style={[styles.confidenceTitle, { color: colors.textMuted }]}>
                            HOW DID YOU DO?
                        </Text>
                        <View style={styles.confidenceRow}>
                            {CONFIDENCE_OPTIONS.map((option) => {
                                const selected = confidence[question.id] === option.key;
                                return (
                                    <TouchableOpacity
                                        key={option.key}
                                        style={[
                                            styles.confidenceButton,
                                            {
                                                backgroundColor: selected ? `${option.color}1F` : colors.card,
                                                borderColor: selected ? option.color : colors.border,
                                                borderRadius: borderRadius.lg,
                                            },
                                        ]}
                                        onPress={() =>
                                            setConfidence((prev) => ({ ...prev, [question.id]: option.key }))
                                        }
                                        accessibilityRole="button"
                                        accessibilityLabel={`Confidence: ${option.label}`}
                                    >
                                        <MaterialCommunityIcons
                                            name={option.icon as any}
                                            size={26}
                                            color={selected ? option.color : colors.textMuted}
                                        />
                                        <Text
                                            style={[
                                                styles.confidenceLabel,
                                                { color: selected ? option.color : colors.textMuted },
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Next question */}
                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        {
                            backgroundColor: isLast ? colors.card : colors.primary,
                            borderColor: colors.border,
                            borderWidth: isLast ? 1 : 0,
                            borderRadius: borderRadius.round,
                            opacity: isLast && !revealed ? 0.5 : 1,
                        },
                    ]}
                    onPress={handleNext}
                    disabled={isLast}
                    accessibilityRole="button"
                    accessibilityLabel={isLast ? 'Last question' : 'Next question'}
                >
                    <Text
                        style={[
                            styles.nextButtonText,
                            { color: isLast ? colors.textMuted : '#FFFFFF' },
                        ]}
                    >
                        {isLast ? 'End of session — great work!' : 'Next Question'}
                    </Text>
                    {!isLast && <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />}
                </TouchableOpacity>
            </ScrollView>
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
    scrollContent: {
        paddingTop: 20,
    },
    pillsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 24,
    },
    pill: {
        flex: 1,
        maxWidth: 44,
        height: 5,
        borderRadius: 3,
    },
    counter: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 8,
    },
    questionCard: {
        borderWidth: 1,
        padding: 20,
        marginHorizontal: 16,
        marginTop: 18,
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    examinerIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    examinerLabel: {
        flex: 1,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    questionText: {
        fontWeight: '700',
        lineHeight: 27,
        marginBottom: 20,
    },
    revealButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1.5,
        paddingVertical: 13,
    },
    revealText: {
        fontSize: 15,
        fontWeight: '700',
    },
    answerBox: {
        padding: 14,
    },
    answerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    answerLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    answerText: {
        lineHeight: 22,
    },
    confidenceSection: {
        marginTop: 22,
        paddingHorizontal: 16,
    },
    confidenceTitle: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        textAlign: 'center',
        marginBottom: 12,
    },
    confidenceRow: {
        flexDirection: 'row',
        gap: 10,
    },
    confidenceButton: {
        flex: 1,
        alignItems: 'center',
        borderWidth: 1.5,
        paddingVertical: 14,
        gap: 6,
    },
    confidenceLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 52,
        marginHorizontal: 16,
        marginTop: 24,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
});

export default VivaScreen;
