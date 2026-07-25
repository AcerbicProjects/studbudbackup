import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';
import { AIStackParamList } from '../../types/ai';
import QuizCard from '../../components/ai/QuizCard';
import { mockQuizQuestions, mockQuizMeta } from '../../data/mockAIData';

const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// AI Quiz — one question at a time with progress bar and elapsed timer.
// Week 1: mock questions; scoring is local. Result is pushed to QuizResult.
export const QuizScreen: React.FC = () => {
    const { colors, borderRadius, typography } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<AIStackParamList>>();

    const questions = mockQuizQuestions;
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string | null>>({});
    const [elapsed, setElapsed] = useState(0);

    const question = questions[index];
    const selectedAnswer = answers[question.id] ?? null;
    const progress = ((index + 1) / questions.length) * 100;
    const isLast = index === questions.length - 1;

    useEffect(() => {
        const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleSelect = (answer: string) => {
        setAnswers((prev) => ({ ...prev, [question.id]: answer }));
    };

    const countCorrect = () =>
        questions.reduce(
            (total, q) =>
                answers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
                    ? total + 1
                    : total,
            0
        );

    const handleNext = () => {
        if (!isLast) {
            setIndex((i) => i + 1);
            return;
        }
        const unanswered = questions.filter((q) => !answers[q.id]).length;
        const submit = () =>
            navigation.replace('QuizResult', {
                correct: countCorrect(),
                total: questions.length,
                timeSeconds: elapsed,
                answers,
            });

        if (unanswered > 0) {
            Alert.alert(
                'Submit quiz?',
                `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}.`,
                [
                    { text: 'Keep going', style: 'cancel' },
                    { text: 'Submit', style: 'destructive', onPress: submit },
                ]
            );
        } else {
            submit();
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerButton}
                    accessibilityRole="button"
                    accessibilityLabel="Exit quiz"
                >
                    <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontSize: typography.fontSize.md }]}>
                    Quiz
                </Text>
                <View style={[styles.timerBadge, { backgroundColor: colors.inputBg }]}>
                    <MaterialCommunityIcons name="timer-outline" size={15} color={colors.textMuted} />
                    <Text style={[styles.timerText, { color: colors.text }]}>{formatTime(elapsed)}</Text>
                </View>
            </View>

            {/* Progress */}
            <View style={styles.progressSection}>
                <View style={styles.progressLabels}>
                    <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
                        Question {index + 1} of {questions.length}
                    </Text>
                    <Text style={[styles.progressLabel, { color: colors.primary }]}>
                        {mockQuizMeta.documentTitle}
                    </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${progress}%`, backgroundColor: colors.primary },
                        ]}
                    />
                </View>
            </View>

            {/* Question */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <QuizCard
                    question={question}
                    selectedAnswer={selectedAnswer}
                    onSelectAnswer={handleSelect}
                />
            </ScrollView>

            {/* Footer nav */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity
                    style={[
                        styles.footerButton,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            borderRadius: borderRadius.round,
                            opacity: index === 0 ? 0.4 : 1,
                        },
                    ]}
                    onPress={() => setIndex((i) => Math.max(0, i - 1))}
                    disabled={index === 0}
                    accessibilityRole="button"
                    accessibilityLabel="Previous question"
                >
                    <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.footerButtonWide,
                        {
                            backgroundColor: isLast ? colors.accent : colors.primary,
                            borderRadius: borderRadius.round,
                        },
                    ]}
                    onPress={handleNext}
                    accessibilityRole="button"
                    accessibilityLabel={isLast ? 'Submit quiz' : 'Next question'}
                >
                    <Text style={styles.footerButtonText}>{isLast ? 'Submit Quiz' : 'Next'}</Text>
                    <MaterialCommunityIcons
                        name={isLast ? 'check-bold' : 'arrow-right'}
                        size={20}
                        color="#FFF"
                    />
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
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 9999,
        marginRight: 6,
    },
    timerText: {
        fontSize: 13,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    progressSection: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        gap: 8,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: '600',
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
    scrollContent: {
        paddingVertical: 12,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
    },
    footerButton: {
        width: 52,
        height: 52,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerButtonWide: {
        flex: 1,
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    footerButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default QuizScreen;
