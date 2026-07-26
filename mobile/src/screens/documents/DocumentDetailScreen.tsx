import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Modal, Platform } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api, { getBaseUrl } from '../../lib/api';
import { WebView } from 'react-native-webview';
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
    const navigation = useNavigation<any>();

    // Fetch the real document state gracefully instead of strictly mocking
    const [document, setDocument] = useState<any>(mockDocs.find((doc) => doc.id === documentId) || mockDocs[0]!);

    React.useEffect(() => {
        const fetchDoc = async () => {
            try {
                const response = await api.get(`/api/documents/${documentId}`);
                if (response.data) {
                    setDocument(response.data);
                }
            } catch (err) {
                console.warn('Failed to load document:', err);
            }
        };
        fetchDoc();
    }, [documentId]);

    const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);

    const handleViewDocument = () => {
        // Try storedFilename first, then fall back to any url field from the document
        const filename = document.storedFilename || document.fileUrl || document.url;
        if (!filename) {
            alert("This document doesn't have a viewable file yet.");
            return;
        }
        // Build the full URL if it's a relative path
        let fullUrl = filename.startsWith('http') ? filename : `${getBaseUrl()}/${(filename as string).replace(/\\/g, '/')}`;
        // On Android emulator, remap localhost
        if (Platform.OS === 'android') {
            fullUrl = fullUrl.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
        }
        console.log('[DocViewer] Opening URL:', fullUrl);
        setPdfViewerUrl(fullUrl);
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/api/documents/${document._id || document.id}`);
            onBackPress(); // Route back
        } catch (err) {
            console.error('Delete failed', err);
            alert('Failed to delete document.');
        }
    };

    // When true, the AI tools hub replaces the document detail view
    const [showAITools, setShowAITools] = useState(false);

    // --- AI Accelerator Tools hub view ---
    if (showAITools) {
        return <AINavigator onBack={() => setShowAITools(false)} documentId={documentId} />;
    }

    // --- PDF Viewer (fullscreen early return) ---
    if (pdfViewerUrl) {
        const pdfJsUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfViewerUrl)}`;

        const header = (
            <View style={[styles.headerRow, { paddingTop: Math.max(insets.top, 16) }]}>
                <TouchableOpacity
                    onPress={() => setPdfViewerUrl(null)}
                    style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                    <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headingTitle, { color: colors.text, fontSize: typography.fontSize.md }]}>Document Viewer</Text>
                <View style={styles.backBtn} />
            </View>
        );

        if (Platform.OS === 'web') {
            // On web: use the browser's built-in PDF renderer via a direct iframe.
            // Remote pdf.js (mozilla.github.io) is blocked by CORS for localhost URLs.
            return (
                <View style={{ flex: 1, backgroundColor: colors.background }}>
                    {header}
                    {/* @ts-ignore – using HTML elements inside RN Web */}
                    <div style={{ width: '100%', height: 'calc(100vh - 72px)' }}>
                        {/* @ts-ignore */}
                        <iframe
                            src={pdfViewerUrl}
                            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                            title="PDF Viewer"
                        />
                    </div>
                </View>
            );
        }

        return (
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                {header}
                <WebView
                    // For native WebView, use pdf.js to render (no CORS restriction in native)
                    source={{ uri: pdfJsUrl }}
                    style={{ flex: 1 }}
                    mixedContentMode="always"
                    allowFileAccess
                    startInLoadingState
                    renderLoading={() => (
                        <View style={{ ...(StyleSheet.absoluteFill as any), justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                            <MaterialCommunityIcons name="file-pdf-box" size={48} color="#8B5CF6" />
                            <Text style={{ color: colors.text, marginTop: 12, fontWeight: '600' }}>Loading PDF...</Text>
                        </View>
                    )}
                />
            </View>
        );
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
                    onPress={handleDelete}
                    style={[styles.backBtn, { backgroundColor: colors.card, borderColor: 'rgba(239, 68, 68, 0.4)' }]}
                >
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={[styles.contentPadding, { paddingBottom: 110 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* PDF Document Preview Area representation */}
                {/* Real document Viewer Link Action */}
                <TouchableOpacity
                    onPress={handleViewDocument}
                    activeOpacity={0.85}
                    style={[styles.pdfMockPreview, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.xl }]}
                >
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.03)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <MaterialCommunityIcons name="file-pdf-box" size={72} color="#8B5CF6" />
                    <Text style={[styles.pdfFileName, { color: colors.text, fontSize: typography.fontSize.sm }]}>
                        Tap to View Original Document
                    </Text>
                    <Text style={[styles.pdfFileSize, { color: colors.textMuted, fontSize: typography.fontSize.xs }]}>
                        {document.fileSize ? (document.fileSize / 1024 / 1024).toFixed(2) + ' MB • ' : ''}Original Resource
                    </Text>
                </TouchableOpacity>

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
