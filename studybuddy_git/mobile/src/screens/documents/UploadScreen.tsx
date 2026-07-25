import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const STORAGE_PROVIDERS = [
    { id: 'device', name: 'From Device', icon: 'tablet-cellphone', color: '#8B5CF6' },
    { id: 'gdrive', name: 'Google Drive', icon: 'google-drive', color: '#10B981' },
    { id: 'dropbox', name: 'Dropbox', icon: 'dropbox', color: '#3B82F6' },
    { id: 'onedrive', name: 'OneDrive', icon: 'cloud-upload-outline', color: '#0EA5E9' },
];

export const UploadScreen: React.FC = () => {
    const { colors, typography, borderRadius, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    // Progress animation states
    const [isUploading, setIsUploading] = useState(false);
    const [uploadPercent, setUploadPercent] = useState(0);
    const [isSuccess, setIsSuccess] = useState(false);
    const [activeFileName, setActiveFileName] = useState('');

    // Animated values
    const progressAnim = React.useRef(new Animated.Value(0)).current;
    const successScale = React.useRef(new Animated.Value(0)).current;

    const triggerUploadMock = (providerName: string) => {
        if (isUploading) return;

        // Choose a realistic lecture file name
        const files = [
            "Calculus_Exam_Review.pdf",
            "Organic_Chemistry_Synthesis.pdf",
            "Network_Protocols_Lecture5.pdf",
            "Intro_To_MachineLearning.pdf"
        ];
        const chosenFile = files[Math.floor(Math.random() * files.length)] || "StudyNotes.pdf";

        setActiveFileName(chosenFile);
        setIsUploading(true);
        setIsSuccess(false);
        setUploadPercent(0);
        progressAnim.setValue(0);
        successScale.setValue(0);

        // Simulate progress
        let currentPct = 0;
        const interval = setInterval(() => {
            currentPct += 15;
            if (currentPct >= 100) {
                currentPct = 100;
                clearInterval(interval);

                // Show success animation
                setTimeout(() => {
                    setIsUploading(false);
                    setIsSuccess(true);
                    Animated.spring(successScale, {
                        toValue: 1,
                        friction: 4,
                        tension: 50,
                        useNativeDriver: true,
                    }).start();
                }, 300);
            }
            setUploadPercent(currentPct);
            Animated.timing(progressAnim, {
                toValue: currentPct,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }, 250);
    };

    return (
        <ScrollView
            style={[styles.mainBg, { backgroundColor: colors.background }]}
            contentContainerStyle={[styles.contentPadding, { paddingTop: Math.max(insets.top, 24), paddingBottom: 110 }]}
            showsVerticalScrollIndicator={false}
        >

            {/* Title Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text, fontSize: typography.fontSize.xl + 2 }]}>
                    Upload Center
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: typography.fontSize.sm }]}>
                    Instantly convert academic references into smart study paths
                </Text>
            </View>

            {/* Main Glass Center Drop/Choose Area */}
            <View style={[
                styles.uploadDashboard,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: borderRadius.xl,
                }
            ]}>

                {/* Animated UI depending on upload status */}
                {!isUploading && !isSuccess && (
                    <View style={styles.emptyState}>
                        <View style={[styles.avatarCircle, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                            <MaterialCommunityIcons name="cloud-upload" size={44} color="#8B5CF6" />
                        </View>
                        <Text style={[styles.emptyTitle, { color: colors.text, fontSize: typography.fontSize.md }]}>
                            Drag 'n Drop Files
                        </Text>
                        <Text style={[styles.emptySub, { color: colors.textMuted, fontSize: typography.fontSize.xs + 1 }]}>
                            PDF, PPTX, or DOC formats up to 15MB
                        </Text>
                    </View>
                )}

                {/* Upload Process indicator */}
                {isUploading && (
                    <View style={styles.runningProcess}>
                        <Text style={[styles.activeFile, { color: colors.text, fontSize: typography.fontSize.sm + 1 }]}>
                            Parsing Document...
                        </Text>
                        <Text style={[styles.fileName, { color: colors.textMuted, fontSize: typography.fontSize.xs }]}>
                            {activeFileName}
                        </Text>

                        {/* Custom outer progress track */}
                        <View style={[styles.trackBg, { backgroundColor: colors.border }]}>
                            <Animated.View style={[
                                styles.fillBar,
                                {
                                    backgroundColor: '#8B5CF6',
                                    width: progressAnim.interpolate({
                                        inputRange: [0, 100],
                                        outputRange: ['0%', '100%'],
                                    })
                                }
                            ]} />
                        </View>
                        <Text style={[styles.pctDisplay, { color: '#8B5CF6', fontSize: typography.fontSize.sm }]}>
                            {uploadPercent}% uploaded
                        </Text>
                    </View>
                )}

                {/* Success completion state */}
                {isSuccess && (
                    <Animated.View style={[styles.completeState, { transform: [{ scale: successScale }] }]}>
                        <View style={[styles.avatarCircleSuccess, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                            <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={48} color="#10B981" />
                        </View>

                        <Text style={[styles.completeTitle, { color: colors.text, fontSize: typography.fontSize.md }]}>
                            Analysis Successful!
                        </Text>
                        <Text style={[styles.completeSub, { color: colors.textMuted, fontSize: typography.fontSize.xs + 1 }]}>
                            "{activeFileName}" added to Document Hub.
                        </Text>

                        <TouchableOpacity
                            onPress={() => setIsSuccess(false)}
                            style={[styles.dismissBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                        >
                            <Text style={[styles.dismissText, { color: colors.text, fontSize: typography.fontSize.xs }]}>
                                Upload Another File
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

            </View>

            {/* Cloud Service Connections Grid */}
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.fontSize.md, marginTop: 24 }]}>
                Import Academic Notes From
            </Text>

            <View style={styles.providersGrid}>
                {STORAGE_PROVIDERS.map((provider) => (
                    <TouchableOpacity
                        key={provider.id}
                        onPress={() => triggerUploadMock(provider.name)}
                        activeOpacity={0.8}
                        style={[
                            styles.providerCard,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                borderRadius: borderRadius.lg,
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={['transparent', 'rgba(255,255,255,0.02)']}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={[styles.serviceCircle, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                            <MaterialCommunityIcons name={provider.icon as any} size={24} color={provider.color} />
                        </View>
                        <Text style={[styles.providerName, { color: colors.text, fontSize: typography.fontSize.xs + 1 }]}>
                            {provider.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    mainBg: {
        flex: 1,
    },
    contentPadding: {
        paddingHorizontal: 16,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontWeight: '900',
        letterSpacing: -0.6,
    },
    subtitle: {
        fontWeight: '500',
        marginTop: 4,
    },
    uploadDashboard: {
        borderWidth: 1,
        borderStyle: 'dashed',
        height: 220,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    emptyState: {
        alignItems: 'center',
    },
    avatarCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    emptyTitle: {
        fontWeight: '700',
    },
    emptySub: {
        fontWeight: '500',
        marginTop: 4,
    },
    runningProcess: {
        alignItems: 'center',
        width: '100%',
    },
    activeFile: {
        fontWeight: '700',
    },
    fileName: {
        fontWeight: '500',
        marginTop: 2,
        marginBottom: 16,
    },
    trackBg: {
        width: '90%',
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    fillBar: {
        height: '100%',
        borderRadius: 4,
    },
    pctDisplay: {
        fontWeight: '700',
        marginTop: 10,
    },
    completeState: {
        alignItems: 'center',
        width: '100%',
    },
    avatarCircleSuccess: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    completeTitle: {
        fontWeight: '800',
    },
    completeSub: {
        fontWeight: '500',
        marginTop: 3,
        marginBottom: 16,
        textAlign: 'center',
    },
    dismissBtn: {
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    dismissText: {
        fontWeight: '700',
    },
    sectionTitle: {
        fontWeight: '800',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    providersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    providerCard: {
        width: (width - 48) / 2,
        padding: 16,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 1.5,
    },
    serviceCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    providerName: {
        fontWeight: '700',
    },
});

export default UploadScreen;
