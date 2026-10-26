import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Animated, Dimensions, Alert } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import SubjectChips from '../../components/documents/SubjectChips';
import { ALL_FOLDER, folderToSubject, useDocuments } from '../../context/DocumentsContext';
import { StudyDocument, getErrorMessage } from '../../services/DocumentService';

const { width } = Dimensions.get('window');

// The system file picker can browse the device and any installed cloud drive apps
const STORAGE_PROVIDERS = [
    { id: 'device', name: 'From Device', icon: 'tablet-cellphone', color: '#8B5CF6' },
    { id: 'gdrive', name: 'Google Drive', icon: 'google-drive', color: '#10B981' },
    { id: 'dropbox', name: 'Dropbox', icon: 'dropbox', color: '#3B82F6' },
    { id: 'onedrive', name: 'OneDrive', icon: 'cloud-upload-outline', color: '#0EA5E9' },
];

const ACCEPTED_TYPES = ['application/pdf', 'image/*', 'text/plain', 'text/markdown'];
const MAX_FILE_BYTES = 20 * 1024 * 1024;

interface UploadScreenProps {
    onOpenDocument?: (docId: string) => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({ onOpenDocument }) => {
    const { colors, typography, borderRadius, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const { uploadDocument, selectedFolder } = useDocuments();

    // Progress animation states
    const [isUploading, setIsUploading] = useState(false);
    const [uploadPercent, setUploadPercent] = useState(0);
    const [isSuccess, setIsSuccess] = useState(false);
    const [activeFileName, setActiveFileName] = useState('');
    const [uploadedDoc, setUploadedDoc] = useState<StudyDocument | null>(null);

    // Animated values
    const progressAnim = React.useRef(new Animated.Value(0)).current;
    const successScale = React.useRef(new Animated.Value(0)).current;

    const setProgress = (percent: number) => {
        setUploadPercent(percent);
        Animated.timing(progressAnim, {
            toValue: percent,
            duration: 200,
            useNativeDriver: false,
        }).start();
    };

    const triggerUpload = async () => {
        if (isUploading) return;

        const result = await DocumentPicker.getDocumentAsync({
            type: ACCEPTED_TYPES,
            copyToCacheDirectory: true,
            multiple: false,
        });
        if (result.canceled || !result.assets?.length) return;

        const asset = result.assets[0];
        if (asset.size && asset.size > MAX_FILE_BYTES) {
            Alert.alert('File too large', 'Please choose a file under 20MB.');
            return;
        }

        setActiveFileName(asset.name);
        setIsUploading(true);
        setIsSuccess(false);
        setUploadedDoc(null);
        progressAnim.setValue(0);
        successScale.setValue(0);
        setProgress(0);

        try {
            const doc = await uploadDocument(
                { uri: asset.uri, name: asset.name, mimeType: asset.mimeType || 'application/pdf' },
                { source: 'upload', subject: folderToSubject(selectedFolder) },
                setProgress
            );
            setUploadedDoc(doc);
            setIsSuccess(true);
            Animated.spring(successScale, {
                toValue: 1,
                friction: 4,
                tension: 50,
                useNativeDriver: true,
            }).start();
        } catch (err) {
            Alert.alert('Upload failed', getErrorMessage(err));
        } finally {
            setIsUploading(false);
        }
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

            {/* Destination folder (same selection as Home) */}
            <Text style={[styles.saveToLabel, { color: colors.textMuted, fontSize: typography.fontSize.xs }]}>
                {selectedFolder === ALL_FOLDER ? 'SAVE TO · AI picks the subject' : `SAVE TO · ${selectedFolder.toUpperCase()}`}
            </Text>
            <SubjectChips editable={false} />

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
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={triggerUpload}
                        style={styles.emptyState}
                        accessibilityRole="button"
                        accessibilityLabel="Choose a file to upload"
                    >
                        <View style={[styles.avatarCircle, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                            <MaterialCommunityIcons name="cloud-upload" size={44} color="#8B5CF6" />
                        </View>
                        <Text style={[styles.emptyTitle, { color: colors.text, fontSize: typography.fontSize.md }]}>
                            Tap to Choose a File
                        </Text>
                        <Text style={[styles.emptySub, { color: colors.textMuted, fontSize: typography.fontSize.xs + 1 }]}>
                            PDF, image or text files up to 20MB
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Upload Process indicator */}
                {isUploading && (
                    <View style={styles.runningProcess}>
                        <Text style={[styles.activeFile, { color: colors.text, fontSize: typography.fontSize.sm + 1 }]}>
                            {uploadPercent < 100 ? 'Uploading Document...' : 'Reading & Analyzing...'}
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
                            {uploadPercent < 100 ? `${uploadPercent}% uploaded` : 'Extracting text, almost done'}
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
                            "{uploadedDoc?.title || activeFileName}" added to Document Hub.
                        </Text>

                        <View style={styles.successActions}>
                            {uploadedDoc && onOpenDocument && (
                                <TouchableOpacity
                                    onPress={() => onOpenDocument(uploadedDoc._id)}
                                    style={[styles.dismissBtn, { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }]}
                                >
                                    <Text style={[styles.dismissText, { color: '#FFF', fontSize: typography.fontSize.xs }]}>
                                        Open Document
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                onPress={() => setIsSuccess(false)}
                                style={[styles.dismissBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                            >
                                <Text style={[styles.dismissText, { color: colors.text, fontSize: typography.fontSize.xs }]}>
                                    Upload Another File
                                </Text>
                            </TouchableOpacity>
                        </View>
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
                        onPress={triggerUpload}
                        disabled={isUploading}
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
    successActions: {
        flexDirection: 'row',
        gap: 8,
    },
    saveToLabel: {
        fontWeight: '800',
        letterSpacing: 0.6,
        marginBottom: 8,
        paddingHorizontal: 4,
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
