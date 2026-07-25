import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AINavigator } from '../../navigation/AINavigator';

import { documents as mockDocs } from '../../data/documents';

const { width } = Dimensions.get('window');

interface DocumentDetailScreenProps {
    documentId: string;
    onBackPress: () => void;
}

export const DocumentDetailScreen: React.FC<DocumentDetailScreenProps> = ({ documentId, onBackPress }) => {
    const { colors, typography, borderRadius, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    // Find document from mock records
    const document = mockDocs.find((doc) => doc.id === documentId) || mockDocs[0]!;

    // When true, the AI tools hub replaces the document detail view
    const [showAITools, setShowAITools] = useState(false);

    // --- AI Accelerator Tools hub view ---
    if (showAITools) {
        return <AINavigator onBack={() => setShowAITools(false)} />;
    }

    // --- Normal document detail view ---
    return (
        <View style={[styles.mainBg, { backgroundColor: colors.background }]}>

            {/* Dynamic Sub-header Navigation row */}
            <View style={[styles.headerRow, { paddingTop: Math.max(insets.top, 16) }]}>
                <TouchableOpacity
                    onPress={onBackPress}
                    style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                    <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
                </TouchableOpacity>

                <Text style={[styles.headingTitle, { color: colors.text, fontSize: typography.fontSize.md }]}>
                    Syllabus Detail
                </Text>

                <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                    <MaterialCommunityIcons name="bookmark-outline" size={20} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={[styles.contentPadding, { paddingBottom: 110 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* PDF Document Preview Area representation */}
                <View style={[styles.pdfMockPreview, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.xl }]}>
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.03)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <MaterialCommunityIcons name="file-pdf-box" size={72} color="#8B5CF6" />
                    <Text style={[styles.pdfFileName, { color: colors.text, fontSize: typography.fontSize.sm }]}>
                        {document.title}
                    </Text>
                    <Text style={[styles.pdfFileSize, { color: colors.textMuted, fontSize: typography.fontSize.xs }]}>
                        {document.pages} Pages • Mock PDF Preview Mode
                    </Text>
                </View>

                {/* Informational description panel */}
                <View style={styles.metaPanel}>
                    <View style={styles.tagRow}>
                        <View style={[styles.tagBadge, { backgroundColor: '#8B5CF6' }]}>
                            <Text style={styles.tagLabelText}>{document.subject}</Text>
                        </View>
                        <View style={[styles.tagBadge, { backgroundColor: colors.border }]}>
                            <Text style={[styles.tagLabelText, { color: colors.text }]}>Study Buddy AI Pin</Text>
                        </View>
                    </View>

                    <Text style={[styles.docDocTitle, { color: colors.text, fontSize: typography.fontSize.lg + 1 }]}>
                        {document.title}
                    </Text>

                    {/* Quick Metrics display grid */}
                    <View style={styles.metricsRow}>
                        <View style={[styles.metricCard, { backgroundColor: colors.inputBg, borderRadius: borderRadius.md }]}>
                            <MaterialCommunityIcons name="timer-outline" size={20} color="#8B5CF6" />
                            <Text style={[styles.metricValue, { color: colors.text }]}>{document.studyTime}</Text>
                            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Study Limit</Text>
                        </View>

                        <View style={[styles.metricCard, { backgroundColor: colors.inputBg, borderRadius: borderRadius.md }]}>
                            <MaterialCommunityIcons name="book-open-page-variant" size={20} color="#10B981" />
                            <Text style={[styles.metricValue, { color: colors.text }]}>{document.progress}%</Text>
                            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Coverage</Text>
                        </View>
                    </View>
                </View>

                {/* --- AI ACCELERATOR TOOLS — single entry point --- */}
                <Text style={[styles.sectionHeading, { color: colors.text, fontSize: typography.fontSize.md }]}>
                    AI Workspace
                </Text>

                <TouchableOpacity
                    onPress={() => setShowAITools(true)}
                    activeOpacity={0.85}
                    style={[
                        styles.aiCard,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            borderRadius: borderRadius.xl,
                        },
                    ]}
                >
                    <View style={styles.aiCardRow}>
                        <View style={styles.aiIconCircle}>
                            <LinearGradient
                                colors={['#8B5CF6', '#6366F1']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.aiIconGradient}
                            />
                            <MaterialCommunityIcons name="brain" size={26} color="#FFF" />
                        </View>

                        <View style={styles.aiCardText}>
                            <Text style={[styles.aiCardTitle, { color: colors.text, fontSize: typography.fontSize.md }]}>
                                AI Accelerator Tools
                            </Text>
                            <Text style={[styles.aiCardSub, { color: colors.textMuted }]}>
                                Chat, Summary, Quiz, Flashcards & more
                            </Text>
                        </View>

                        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
                    </View>

                    {/* Mini pill badges showing available tools */}
                    <View style={styles.aiPillRow}>
                        {[
                            { icon: 'chat-processing-outline', label: 'Chat', color: '#4F46E5' },
                            { icon: 'text-box-check-outline', label: 'Summary', color: '#8B5CF6' },
                            { icon: 'cards-outline', label: 'Cards', color: '#06B6D4' },
                            { icon: 'head-question-outline', label: 'Quiz', color: '#F59E0B' },
                            { icon: 'microphone-variant', label: 'Viva', color: '#22C55E' },
                        ].map((pill) => (
                            <View
                                key={pill.label}
                                style={[styles.aiPill, { backgroundColor: `${pill.color}14` }]}
                            >
                                <MaterialCommunityIcons name={pill.icon as any} size={12} color={pill.color} />
                                <Text style={[styles.aiPillText, { color: pill.color }]}>{pill.label}</Text>
                            </View>
                        ))}
                    </View>
                </TouchableOpacity>

            </ScrollView>

        </View>
    );
};

const styles = StyleSheet.create({
    mainBg: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headingTitle: {
        fontWeight: '800',
    },
    contentPadding: {
        paddingHorizontal: 16,
    },
    pdfMockPreview: {
        height: 180,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 3,
    },
    pdfFileName: {
        fontWeight: '700',
        marginTop: 10,
    },
    pdfFileSize: {
        fontWeight: '500',
        marginTop: 2,
    },
    metaPanel: {
        paddingVertical: 12,
    },
    tagRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    tagBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 8,
    },
    tagLabelText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    docDocTitle: {
        fontWeight: '900',
        letterSpacing: -0.5,
        lineHeight: 26,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    metricCard: {
        width: (width - 44) / 2,
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
    },
    metricValue: {
        fontWeight: '800',
        fontSize: 14,
        marginTop: 6,
    },
    metricLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    sectionHeading: {
        fontWeight: '800',
        marginTop: 16,
        marginBottom: 12,
    },
    // --- AI Accelerator Tools card ---
    aiCard: {
        borderWidth: 1,
        padding: 16,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 3,
    },
    aiCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    aiIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    aiIconGradient: {
        ...StyleSheet.absoluteFill,
    },
    aiCardText: {
        flex: 1,
    },
    aiCardTitle: {
        fontWeight: '800',
    },
    aiCardSub: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    aiPillRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 14,
    },
    aiPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 9999,
    },
    aiPillText: {
        fontSize: 10,
        fontWeight: '700',
    },
});

export default DocumentDetailScreen;
