import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SummarySection } from '../../data/mockAIData';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SummaryCardProps {
    section: SummarySection;
    initiallyExpanded?: boolean;
}

// Expandable section card for the Summary screen (Key Concepts, Definitions, ...).
export const SummaryCard: React.FC<SummaryCardProps> = ({ section, initiallyExpanded = false }) => {
    const { colors, borderRadius, typography } = useTheme();
    const [expanded, setExpanded] = useState(initiallyExpanded);

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: borderRadius.lg,
                },
            ]}
        >
            <TouchableOpacity
                style={styles.header}
                onPress={toggle}
                accessibilityRole="button"
                accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${section.title}`}
            >
                <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}1A` }]}>
                    <MaterialCommunityIcons name={section.icon as any} size={18} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.text, fontSize: typography.fontSize.md }]}>
                    {section.title}
                </Text>
                <View style={[styles.countBadge, { backgroundColor: colors.inputBg }]}>
                    <Text style={[styles.countText, { color: colors.textMuted }]}>{section.points.length}</Text>
                </View>
                <MaterialCommunityIcons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={colors.textMuted}
                />
            </TouchableOpacity>

            {expanded && (
                <View style={[styles.body, { borderTopColor: colors.border }]}>
                    {section.points.map((point, index) => (
                        <View key={index} style={styles.pointRow}>
                            <View style={[styles.bullet, { backgroundColor: colors.secondary }]} />
                            <Text
                                style={[
                                    styles.pointText,
                                    { color: colors.text, fontSize: typography.fontSize.sm + 1 },
                                ]}
                            >
                                {point}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        marginHorizontal: 16,
        marginVertical: 6,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    iconWrap: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        flex: 1,
        fontWeight: '700',
    },
    countBadge: {
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 7,
    },
    countText: {
        fontSize: 11,
        fontWeight: '700',
    },
    body: {
        borderTopWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
    },
    pointRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 7,
    },
    pointText: {
        flex: 1,
        lineHeight: 21,
    },
});

export default SummaryCard;
