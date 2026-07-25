import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../constants/theme';
import { Difficulty } from '../../data/mockAIData';

interface DifficultyChipProps {
    difficulty: Difficulty;
    size?: 'sm' | 'md';
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
    easy: '#22C55E',
    medium: '#F59E0B',
    hard: '#EF4444',
};

export const DifficultyChip: React.FC<DifficultyChipProps> = ({ difficulty, size = 'md' }) => {
    const { isDark } = useTheme();
    const color = DIFFICULTY_COLORS[difficulty];

    return (
        <View
            style={[
                styles.chip,
                size === 'sm' && styles.chipSm,
                {
                    backgroundColor: isDark ? `${color}26` : `${color}1A`, // ~15/10% alpha tint
                    borderColor: `${color}66`,
                },
            ]}
        >
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={[styles.label, size === 'sm' && styles.labelSm, { color }]}>
                {difficulty.toUpperCase()}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9999,
        borderWidth: 1,
    },
    chipSm: {
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    label: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    labelSm: {
        fontSize: 9,
    },
});

export default DifficultyChip;
