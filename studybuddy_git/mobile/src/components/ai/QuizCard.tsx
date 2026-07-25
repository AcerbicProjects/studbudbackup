import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { QuizQuestion } from '../../data/mockAIData';
import DifficultyChip from './DifficultyChip';

interface QuizCardProps {
    question: QuizQuestion;
    selectedAnswer: string | null;
    onSelectAnswer: (answer: string) => void;
    showResult?: boolean; // review mode: highlight correct/wrong
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export const QuizCard: React.FC<QuizCardProps> = ({
    question,
    selectedAnswer,
    onSelectAnswer,
    showResult = false,
}) => {
    const { colors, borderRadius, typography } = useTheme();

    const getOptionColors = (option: string) => {
        const isSelected = selectedAnswer === option;
        const isCorrect = option === question.correctAnswer;

        if (showResult) {
            if (isCorrect) return { border: colors.success, bg: `${colors.success}1A`, label: colors.success };
            if (isSelected && !isCorrect) return { border: colors.error, bg: `${colors.error}1A`, label: colors.error };
            return { border: colors.border, bg: 'transparent', label: colors.textMuted };
        }
        if (isSelected) return { border: colors.primary, bg: `${colors.primary}1A`, label: colors.primary };
        return { border: colors.border, bg: 'transparent', label: colors.textMuted };
    };

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: borderRadius.xl,
                },
            ]}
        >
            <View style={styles.header}>
                <DifficultyChip difficulty={question.difficulty} size="sm" />
                <View style={[styles.typeBadge, { backgroundColor: colors.inputBg }]}>
                    <Text style={[styles.typeText, { color: colors.textMuted }]}>
                        {question.type === 'mcq' ? 'MULTIPLE CHOICE' : question.type === 'truefalse' ? 'TRUE / FALSE' : 'SHORT ANSWER'}
                    </Text>
                </View>
            </View>

            <Text style={[styles.question, { color: colors.text, fontSize: typography.fontSize.lg }]}>
                {question.question}
            </Text>

            {/* Options for MCQ / True-False */}
            {question.options ? (
                <View style={styles.options}>
                    {question.options.map((option, index) => {
                        const optionColors = getOptionColors(option);
                        const isSelected = selectedAnswer === option;
                        return (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.option,
                                    {
                                        borderColor: optionColors.border,
                                        backgroundColor: optionColors.bg,
                                        borderRadius: borderRadius.md,
                                    },
                                ]}
                                onPress={() => onSelectAnswer(option)}
                                disabled={showResult}
                                accessibilityRole="button"
                                accessibilityLabel={`Option ${OPTION_LABELS[index]}: ${option}`}
                            >
                                <View
                                    style={[
                                        styles.optionLabel,
                                        {
                                            borderColor: optionColors.border,
                                            backgroundColor: isSelected || (showResult && option === question.correctAnswer)
                                                ? optionColors.border
                                                : 'transparent',
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.optionLabelText,
                                            {
                                                color: isSelected || (showResult && option === question.correctAnswer)
                                                    ? '#FFF'
                                                    : optionColors.label,
                                            },
                                        ]}
                                    >
                                        {question.type === 'truefalse' ? (option === 'True' ? 'T' : 'F') : OPTION_LABELS[index]}
                                    </Text>
                                </View>
                                <Text style={[styles.optionText, { color: colors.text }]}>{option}</Text>
                                {showResult && option === question.correctAnswer && (
                                    <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
                                )}
                                {showResult && isSelected && option !== question.correctAnswer && (
                                    <MaterialCommunityIcons name="close-circle" size={20} color={colors.error} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ) : (
                /* Short answer input */
                <TextInput
                    style={[
                        styles.shortInput,
                        {
                            borderColor: showResult
                                ? selectedAnswer?.trim() === question.correctAnswer
                                    ? colors.success
                                    : colors.error
                                : colors.border,
                            backgroundColor: colors.inputBg,
                            color: colors.text,
                            borderRadius: borderRadius.md,
                            fontSize: typography.fontSize.md,
                        },
                    ]}
                    value={selectedAnswer ?? ''}
                    onChangeText={onSelectAnswer}
                    placeholder="Type your answer..."
                    placeholderTextColor={colors.textMuted}
                    editable={!showResult}
                />
            )}

            {/* Explanation shown in review mode */}
            {showResult && (
                <View
                    style={[
                        styles.explanation,
                        { backgroundColor: colors.inputBg, borderRadius: borderRadius.md },
                    ]}
                >
                    <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color={colors.secondary} />
                    <Text style={[styles.explanationText, { color: colors.textMuted }]}>
                        {question.explanation}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        padding: 20,
        marginHorizontal: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9999,
    },
    typeText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.6,
    },
    question: {
        fontWeight: '700',
        lineHeight: 26,
        marginBottom: 18,
    },
    options: {
        gap: 10,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 12,
    },
    optionLabel: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionLabelText: {
        fontSize: 12,
        fontWeight: '800',
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
    },
    shortInput: {
        borderWidth: 1.5,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    explanation: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        padding: 12,
        marginTop: 14,
    },
    explanationText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 19,
    },
});

export default QuizCard;
