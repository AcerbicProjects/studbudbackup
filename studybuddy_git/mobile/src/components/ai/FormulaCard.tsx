import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FormulaData } from '../../data/mockAIData';

interface FormulaCardProps {
    formula: FormulaData;
}

// Highlighted card for a single formula, used in the Summary screen's horizontal rail.
export const FormulaCard: React.FC<FormulaCardProps> = ({ formula }) => {
    const { colors, borderRadius, isDark } = useTheme();

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: isDark ? 'rgba(79, 70, 229, 0.14)' : 'rgba(79, 70, 229, 0.06)',
                    borderColor: `${colors.primary}4D`,
                    borderRadius: borderRadius.lg,
                },
            ]}
        >
            <View style={styles.header}>
                <MaterialCommunityIcons name="function-variant" size={16} color={colors.primary} />
                <Text style={[styles.title, { color: colors.primary }]}>{formula.title}</Text>
            </View>

            <Text style={[styles.formula, { color: colors.text }]}>{formula.formula}</Text>

            <Text style={[styles.note, { color: colors.textMuted }]} numberOfLines={2}>
                {formula.note}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: 200,
        borderWidth: 1,
        padding: 14,
        marginRight: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    title: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
    },
    formula: {
        fontSize: 17,
        fontWeight: '700',
        fontFamily: 'monospace',
        marginBottom: 8,
    },
    note: {
        fontSize: 11,
        lineHeight: 15,
    },
});

export default FormulaCard;
