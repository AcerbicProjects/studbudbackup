import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';
import { AIStackParamList } from '../../types/ai';
import SummaryCard from '../../components/ai/SummaryCard';
import FormulaCard from '../../components/ai/FormulaCard';
import api from '../../lib/api';
import { ActivityIndicator, Alert } from 'react-native';

// Smart Summary — structured revision view of the uploaded document.
// Week 1: static mock content. Copy/share actions become functional in Week 2.
export const SummaryScreen: React.FC = () => {
    const { colors, borderRadius, typography } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<AIStackParamList>>();
    const route = useRoute<RouteProp<AIStackParamList, 'Summary'>>();
    const documentId = route.params?.documentId;

    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);

    React.useEffect(() => {
        if (!documentId) return;
        setLoading(true);
        api.post('/api/ai/summary', { documentId })
            .then((res) => {
                const data = res.data.data;
                const mappedFormulas = data.formulaCards?.map((f: any, i: number) => ({
                    id: `f${i}`,
                    name: f.name,
                    equation: f.formula,
                    explanation: f.explanation || '',
                })) || [];
                const mappedPageSummaries = data.pageSummaries?.map((p: any, i: number) => ({
                    id: `p${i}`,
                    title: p.pageNumber ? `Page ${p.pageNumber}: ${p.title}` : p.title,
                    icon: 'book-open-page-variant-outline',
                    points: p.points || [],
                })) || [];

                setSummary({
                    title: data.title,
                    overview: data.overview,
                    sections: mappedPageSummaries,
                    formulas: mappedFormulas,
                });
            })
            .catch((err) => {
                const msg = err.response?.data?.message || 'Failed to generate Summary.';
                Alert.alert('AI Error', msg);
            })
            .finally(() => setLoading(false));
    }, [documentId]);

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
                    Smart Summary
                </Text>
                <TouchableOpacity
                    style={styles.headerButton}
                    accessibilityRole="button"
                    accessibilityLabel="Share summary"
                >
                    <MaterialCommunityIcons name="share-variant-outline" size={20} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
            >
                {/* Document meta banner */}
                <View
                    style={[
                        styles.metaCard,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            borderRadius: borderRadius.xl,
                        },
                    ]}
                >
                    <View style={[styles.metaIcon, { backgroundColor: `${colors.primary}1A` }]}>
                        <MaterialCommunityIcons name="file-document-outline" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.metaText}>
                        <Text
                            style={[styles.metaTitle, { color: colors.text, fontSize: typography.fontSize.md }]}
                            numberOfLines={1}
                        >
                            {summary?.title || 'Document'}
                        </Text>
                        <Text style={[styles.metaSub, { color: colors.textMuted }]}>
                            StudyBuddy AI Summary
                        </Text>
                    </View>
                    <View style={[styles.aiBadge, { backgroundColor: `${colors.secondary}1F` }]}>
                        <MaterialCommunityIcons name="creation" size={12} color={colors.secondary} />
                        <Text style={[styles.aiBadgeText, { color: colors.secondary }]}>AI</Text>
                    </View>
                </View>

                {loading ? (
                    <View style={{ flex: 1, alignItems: 'center', marginTop: 40 }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={{ color: colors.textMuted, marginTop: 16 }}>Synthesizing knowledge...</Text>
                    </View>
                ) : !summary ? (
                    <View style={{ flex: 1, alignItems: 'center', marginTop: 40 }}>
                        <Text style={{ color: colors.textMuted }}>No summary could be generated.</Text>
                    </View>
                ) : (
                    <>
                        {/* Overview */}
                        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>OVERVIEW</Text>
                        <View
                            style={[
                                styles.overviewCard,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                    borderRadius: borderRadius.lg,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.overviewText,
                                    { color: colors.text, fontSize: typography.fontSize.sm + 1 },
                                ]}
                            >
                                {summary.overview}
                            </Text>
                        </View>

                        {/* Formula rail */}
                        {summary.formulas && summary.formulas.length > 0 && (
                            <>
                                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>FORMULA CARDS</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.formulaRail}
                                >
                                    {summary.formulas.map((formula: any) => (
                                        <FormulaCard key={formula.id} formula={formula} />
                                    ))}
                                </ScrollView>
                            </>
                        )}

                        {/* Expandable sections */}
                        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>BREAKDOWN</Text>
                        {summary.sections.map((section: any, index: number) => (
                            <SummaryCard key={section.id} section={section} initiallyExpanded={index === 0} />
                        ))}
                    </>
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
    metaCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        padding: 14,
        marginHorizontal: 16,
        marginTop: 16,
        gap: 12,
    },
    metaIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metaText: {
        flex: 1,
    },
    metaTitle: {
        fontWeight: '700',
    },
    metaSub: {
        fontSize: 12,
        marginTop: 2,
    },
    aiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 9999,
    },
    aiBadgeText: {
        fontSize: 10,
        fontWeight: '800',
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        marginHorizontal: 16,
        marginTop: 22,
        marginBottom: 8,
    },
    overviewCard: {
        borderWidth: 1,
        padding: 16,
        marginHorizontal: 16,
    },
    overviewText: {
        lineHeight: 22,
    },
    formulaRail: {
        paddingHorizontal: 16,
    },
});

export default SummaryScreen;
