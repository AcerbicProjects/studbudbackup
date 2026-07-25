import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';
import { AIStackParamList } from '../../types/ai';
import ScoreCircle from '../../components/ai/ScoreCircle';
import QuizCard from '../../components/ai/QuizCard';
import { mockQuizQuestions, mockQuizFeedback } from '../../data/mockAIData';

const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
};

// Quiz Result — score ring, stat tiles, AI feedback, retry and answer review.
export const QuizResultScreen: React.FC = () => {
    const { colors, borderRadius, typography } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<AIStackParamList>>();
    const route = useRoute<RouteProp<AIStackParamList, 'QuizResult'>>();

    const { correct, total, timeSeconds, answers } = route.params;
    const wrong = total - correct;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    const [reviewOpen, setReviewOpen] = useState(false);

    const headline =
        percentage >= 80 ? 'Excellent work! 🎉' : percentage >= 50 ? 'Good effort! 👍' : 'Keep practicing! 💪';

    const stats = [
        { icon: 'check-circle-outline', label: 'Correct', value: `${correct}`, color: colors.success },
        { icon: 'close-circle-outline', label: 'Wrong', value: `${wrong}`, color: colors.error },
        { icon: 'timer-outline', label: 'Time', value: formatTime(timeSeconds), color: colors.secondary },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerButton}
                    accessibilityRole="button"
                    accessibilityLabel="Close results"
                >
                    <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontSize: typography.fontSize.md }]}>
                    Quiz Results
                </Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
            >
                {/* Score */}
                <View style={styles.scoreSection}>
                    <ScoreCircle percentage={percentage} />
                    <Text style={[styles.headline, { color: colors.text, fontSize: typography.fontSize.xl }]}>
                        {headline}
                    </Text>
                    <Text style={[styles.subline, { color: colors.textMuted }]}>
                        You answered {correct} of {total} questions correctly
                    </Text>
                </View>

                {/* Stat tiles */}
                <View style={styles.statsRow}>
                    {stats.map((stat) => (
                        <View
                            key={stat.label}
                            style={[
                                styles.statTile,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                    borderRadius: borderRadius.lg,
                                },
                            ]}
                        >
                            <MaterialCommunityIcons name={stat.icon as any} size={20} color={stat.color} />
                            <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* AI feedback */}
                <View
                    style={[
                        styles.feedbackCard,
                        {
                            backgroundColor: colors.card,
                            borderColor: `${colors.secondary}4D`,
                            borderRadius: borderRadius.lg,
                        },
                    ]}
                >
                    <View style={styles.feedbackHeader}>
                        <MaterialCommunityIcons name="robot-happy-outline" size={18} color={colors.secondary} />
                        <Text style={[styles.feedbackTitle, { color: colors.secondary }]}>AI FEEDBACK</Text>
                    </View>
                    <Text
                        style={[
                            styles.feedbackText,
                            { color: colors.text, fontSize: typography.fontSize.sm + 1 },
                        ]}
                    >
                        {mockQuizFeedback}
                    </Text>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            { backgroundColor: colors.primary, borderRadius: borderRadius.round },
                        ]}
                        onPress={() => navigation.replace('Quiz')}
                        accessibilityRole="button"
                        accessibilityLabel="Retry quiz"
                    >
                        <MaterialCommunityIcons name="refresh" size={20} color="#FFF" />
                        <Text style={styles.actionPrimaryText}>Retry Quiz</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                borderWidth: 1,
                                borderRadius: borderRadius.round,
                            },
                        ]}
                        onPress={() => setReviewOpen((open) => !open)}
                        accessibilityRole="button"
                        accessibilityLabel="Review answers"
                    >
                        <MaterialCommunityIcons
                            name={reviewOpen ? 'chevron-up' : 'format-list-checks'}
                            size={20}
                            color={colors.text}
                        />
                        <Text style={[styles.actionSecondaryText, { color: colors.text }]}>
                            {reviewOpen ? 'Hide Review' : 'Review Answers'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Answer review */}
                {reviewOpen && (
                    <View style={styles.reviewList}>
                        {mockQuizQuestions.map((q) => (
                            <View key={q.id} style={styles.reviewItem}>
                                <QuizCard
                                    question={q}
                                    selectedAnswer={answers[q.id] ?? null}
                                    onSelectAnswer={() => {}}
                                    showResult
                                />
                            </View>
                        ))}
                    </View>
                )}
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
    scoreSection: {
        alignItems: 'center',
        paddingTop: 28,
        paddingBottom: 8,
    },
    headline: {
        fontWeight: '800',
        marginTop: 18,
    },
    subline: {
        fontSize: 13,
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: 20,
        gap: 10,
    },
    statTile: {
        flex: 1,
        alignItems: 'center',
        borderWidth: 1,
        paddingVertical: 14,
        gap: 4,
    },
    statValue: {
        fontSize: 17,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    feedbackCard: {
        borderWidth: 1,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
    },
    feedbackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    feedbackTitle: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    feedbackText: {
        lineHeight: 21,
    },
    actions: {
        paddingHorizontal: 16,
        marginTop: 20,
        gap: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 52,
    },
    actionPrimaryText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    actionSecondaryText: {
        fontSize: 16,
        fontWeight: '700',
    },
    reviewList: {
        marginTop: 20,
    },
    reviewItem: {
        marginBottom: 12,
    },
});

export default QuizResultScreen;
