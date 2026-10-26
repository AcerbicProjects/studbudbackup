import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Animated, TouchableOpacity, Dimensions, ActivityIndicator, Alert, Image } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import SubjectChips from '../../components/documents/SubjectChips';
import { ALL_FOLDER, folderToSubject, useDocuments } from '../../context/DocumentsContext';
import { formatFileSize, formatRelativeTime, getErrorMessage } from '../../services/DocumentService';

const { width } = Dimensions.get('window');

// Downscale photos: plenty for reading text, keeps the PDF small
const MAX_IMAGE_WIDTH = 1600;
const MAX_PAGES = 30;

type ScannedPage = { uri: string; base64: string };

const preparePage = async (uri: string): Promise<ScannedPage> => {
    const context = ImageManipulator.manipulate(uri);
    context.resize({ width: MAX_IMAGE_WIDTH });
    const image = await context.renderAsync();
    const result = await image.saveAsync({ compress: 0.75, format: SaveFormat.JPEG, base64: true });
    return { uri: result.uri, base64: result.base64 || '' };
};

// One A4 page per photo, image scaled to fit the page
const buildPdfHtml = (pages: ScannedPage[]) => `
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      @page { size: A4; margin: 0; }
      html, body { margin: 0; padding: 0; }
      .page { width: 100%; height: 100vh; display: flex; align-items: center; justify-content: center; page-break-after: always; }
      .page:last-child { page-break-after: auto; }
      img { max-width: 100%; max-height: 100vh; object-fit: contain; }
    </style>
  </head>
  <body>
    ${pages.map((p) => `<div class="page"><img src="data:image/jpeg;base64,${p.base64}" /></div>`).join('')}
  </body>
</html>`;

interface ScannerScreenProps {
    onOpenDocument?: (docId: string) => void;
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({ onOpenDocument }) => {
    const { colors, typography, borderRadius } = useTheme();
    const insets = useSafeAreaInsets();
    const { documents, uploadDocument, selectedFolder } = useDocuments();

    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [flashlightOn, setFlashlightOn] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pages, setPages] = useState<ScannedPage[]>([]);

    const scansList = useMemo(() => documents.filter((doc) => doc.source === 'scan'), [documents]);

    // Animated value for scanning beam line
    const beamAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Continuous loop of the laser scanning line
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(beamAnim, {
                    toValue: 240, // max sweep height of preview box
                    duration: 2500,
                    useNativeDriver: true,
                }),
                Animated.timing(beamAnim, {
                    toValue: 0,
                    duration: 2500,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);

    const addPages = async (uris: string[]) => {
        const room = MAX_PAGES - pages.length;
        if (room <= 0) {
            Alert.alert('Page limit reached', `A scan can have up to ${MAX_PAGES} pages. Save this one first.`);
            return;
        }
        const prepared = await Promise.all(uris.slice(0, room).map(preparePage));
        setPages((prev) => [...prev, ...prepared]);
    };

    const removePage = (index: number) => {
        setPages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleCapturePress = async () => {
        if (!cameraRef.current || !isCameraReady || isProcessing || isCapturing) return;
        setIsCapturing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
            if (photo?.uri) {
                await addPages([photo.uri]);
            }
        } catch (err) {
            Alert.alert('Camera error', getErrorMessage(err, 'Could not take the photo.'));
        } finally {
            setIsCapturing(false);
        }
    };

    const handleGalleryPress = async () => {
        if (isProcessing) return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: MAX_PAGES - pages.length,
            orderedSelection: true,
            quality: 1,
        });
        if (!result.canceled && result.assets?.length) {
            setIsCapturing(true);
            try {
                await addPages(result.assets.map((a) => a.uri));
            } finally {
                setIsCapturing(false);
            }
        }
    };

    // Combine the pages into one PDF on the phone, then upload it into the selected folder
    const handleSavePdf = async () => {
        if (!pages.length || isProcessing) return;
        setIsProcessing(true);
        try {
            const { uri } = await Print.printToFileAsync({ html: buildPdfHtml(pages), width: 595, height: 842 });
            const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
            const doc = await uploadDocument(
                { uri, name: `Scan-${stamp}.pdf`, mimeType: 'application/pdf' },
                {
                    source: 'scan',
                    subject: folderToSubject(selectedFolder),
                    pageImages: pages.map((p, i) => ({ uri: p.uri, name: `page-${i + 1}.jpg`, mimeType: 'image/jpeg' })),
                }
            );
            setPages([]);
            Alert.alert(
                'PDF saved',
                `"${doc.title}" (${doc.pages} page${doc.pages === 1 ? '' : 's'}) was added to ${doc.subject}.`,
                [
                    { text: 'OK', style: 'cancel' },
                    ...(onOpenDocument ? [{ text: 'Open', onPress: () => onOpenDocument(doc._id) }] : []),
                ]
            );
        } catch (err) {
            Alert.alert('Could not save the scan', getErrorMessage(err));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDiscard = () => {
        Alert.alert('Discard pages?', `${pages.length} scanned page${pages.length === 1 ? '' : 's'} will be removed.`, [
            { text: 'Keep', style: 'cancel' },
            { text: 'Discard', style: 'destructive', onPress: () => setPages([]) },
        ]);
    };

    const renderViewfinderContent = () => {
        if (!permission) {
            return <ActivityIndicator color="#8B5CF6" />;
        }
        if (!permission.granted) {
            return (
                <View style={styles.permissionBox}>
                    <MaterialCommunityIcons name="camera-off-outline" size={36} color="#CBD5E1" />
                    <Text style={styles.permissionText}>
                        StudyBuddy needs camera access to scan your notes.
                    </Text>
                    <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
                        <Text style={styles.permissionButtonText}>Allow Camera</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return (
            <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="back"
                enableTorch={flashlightOn}
                onCameraReady={() => setIsCameraReady(true)}
            />
        );
    };

    const cameraActive = !!permission?.granted;

    return (
        <ScrollView
            style={[styles.mainBg, { backgroundColor: colors.background }]}
            contentContainerStyle={[styles.contentPadding, { paddingTop: Math.max(insets.top, 24), paddingBottom: 110 }]}
            showsVerticalScrollIndicator={false}
        >

            {/* Title Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text, fontSize: typography.fontSize.xl + 2 }]}>
                    Document Scanner
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: typography.fontSize.sm }]}>
                    Capture one or more pages, then save them as a single PDF
                </Text>
            </View>

            {/* Destination folder (same selection as Home) */}
            <Text style={[styles.saveToLabel, { color: colors.textMuted, fontSize: typography.fontSize.xs }]}>
                {selectedFolder === ALL_FOLDER ? 'SAVE TO · AI picks the subject' : `SAVE TO · ${selectedFolder.toUpperCase()}`}
            </Text>
            <SubjectChips editable={false} />

            {/* Camera Preview Box */}
            <View style={[
                styles.scannerViewfinder,
                {
                    backgroundColor: '#0F172A', // dark shade always for camera look
                    borderRadius: borderRadius.xl,
                    borderColor: colors.border,
                }
            ]}>
                {renderViewfinderContent()}

                {/* Transparent grid patterns / Scanner Guideline Marks */}
                <View pointerEvents="none" style={[styles.guideCorner, styles.cornerTopLeft]} />
                <View pointerEvents="none" style={[styles.guideCorner, styles.cornerTopRight]} />
                <View pointerEvents="none" style={[styles.guideCorner, styles.cornerBottomLeft]} />
                <View pointerEvents="none" style={[styles.guideCorner, styles.cornerBottomRight]} />

                {/* Floating Scan Beam Line */}
                {cameraActive && (
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            styles.laserBeam,
                            { transform: [{ translateY: beamAnim }] }
                        ]}
                    >
                        <LinearGradient
                            colors={['rgba(139, 92, 246, 0)', '#8B5CF6', 'rgba(139, 92, 246, 0)']}
                            style={styles.gradientLaser}
                        />
                    </Animated.View>
                )}

                {/* Processing overlay while the PDF is built and the server reads it */}
                {isProcessing && (
                    <View style={styles.processingOverlay}>
                        <ActivityIndicator size="large" color="#FFF" />
                        <Text style={styles.processingText}>Creating PDF & reading your notes...</Text>
                    </View>
                )}

                {/* Page counter */}
                {pages.length > 0 && !isProcessing && (
                    <View style={styles.pageBadge}>
                        <Text style={styles.pageBadgeText}>{pages.length} page{pages.length === 1 ? '' : 's'}</Text>
                    </View>
                )}

                {/* Action icons overlaying camera view */}
                <View style={styles.camControls}>
                    <TouchableOpacity
                        onPress={() => setFlashlightOn(!flashlightOn)}
                        disabled={!cameraActive}
                        style={[styles.camBtn, { backgroundColor: flashlightOn ? '#F59E0B' : 'rgba(255,255,255,0.1)' }]}
                        accessibilityRole="button"
                        accessibilityLabel="Toggle flashlight"
                    >
                        <MaterialCommunityIcons
                            name={flashlightOn ? "flash" : "flash-off"}
                            size={20}
                            color="#FFF"
                        />
                    </TouchableOpacity>

                    {/* Trigger center click to capture */}
                    <TouchableOpacity
                        onPress={handleCapturePress}
                        disabled={!cameraActive || !isCameraReady || isProcessing || isCapturing}
                        style={[styles.triggerButton, { opacity: cameraActive && isCameraReady && !isProcessing && !isCapturing ? 1 : 0.5 }]}
                        accessibilityRole="button"
                        accessibilityLabel="Capture page"
                    >
                        {isCapturing ? <ActivityIndicator color="#8B5CF6" /> : <View style={styles.innerTriggerCircle} />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleGalleryPress}
                        disabled={isProcessing}
                        style={[styles.camBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                        accessibilityRole="button"
                        accessibilityLabel="Add pages from the gallery"
                    >
                        <MaterialCommunityIcons name="image-multiple" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Captured pages tray */}
            {pages.length > 0 && (
                <View style={[styles.tray, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trayRow}>
                        {pages.map((page, index) => (
                            <View key={page.uri} style={styles.thumbWrap}>
                                <Image source={{ uri: page.uri }} style={[styles.thumb, { borderColor: colors.border }]} />
                                <Text style={[styles.thumbLabel, { color: colors.textMuted }]}>{index + 1}</Text>
                                <TouchableOpacity
                                    onPress={() => removePage(index)}
                                    disabled={isProcessing}
                                    style={styles.thumbRemove}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Remove page ${index + 1}`}
                                >
                                    <MaterialCommunityIcons name="close" size={12} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                    <View style={styles.trayActions}>
                        <TouchableOpacity
                            onPress={handleDiscard}
                            disabled={isProcessing}
                            style={[styles.trayButton, { borderColor: colors.border }]}
                        >
                            <Text style={[styles.trayButtonText, { color: colors.textMuted }]}>Discard</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSavePdf}
                            disabled={isProcessing}
                            style={[styles.trayButton, styles.trayPrimary, { opacity: isProcessing ? 0.6 : 1 }]}
                        >
                            <MaterialCommunityIcons name="file-pdf-box" size={18} color="#FFF" />
                            <Text style={[styles.trayButtonText, { color: '#FFF' }]}>
                                Save PDF ({pages.length} page{pages.length === 1 ? '' : 's'})
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Recent Scans list beneath */}
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.fontSize.md, marginTop: 24 }]}>
                Recent Snaps ({scansList.length})
            </Text>

            {scansList.length === 0 && (
                <Text style={[styles.emptyText, { color: colors.textMuted, fontSize: typography.fontSize.xs + 1 }]}>
                    Your scans will appear here. Fill the frame with one page at a time and hold steady.
                </Text>
            )}

            {scansList.map((scan) => (
                <TouchableOpacity
                    key={scan._id}
                    activeOpacity={0.8}
                    onPress={() => onOpenDocument?.(scan._id)}
                    style={[
                        styles.scanRowItem,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            borderRadius: borderRadius.lg,
                        }
                    ]}
                >
                    <View style={[styles.fileCircleIcon, { backgroundColor: '#8B5CF6' }]}>
                        <MaterialCommunityIcons name={scan.mimeType === 'application/pdf' ? 'file-pdf-box' : 'file-image'} size={20} color="#FFF" />
                    </View>
                    <View style={styles.scanMeta}>
                        <Text
                            numberOfLines={1}
                            style={[styles.scanTitle, { color: colors.text, fontSize: typography.fontSize.xs + 2 }]}
                        >
                            {scan.title}
                        </Text>
                        <Text style={[styles.scanDetails, { color: colors.textMuted, fontSize: typography.fontSize.xs }]}>
                            {scan.subject} • {scan.pages} pg • {formatRelativeTime(scan.createdAt)} • {formatFileSize(scan.size)}
                        </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                </TouchableOpacity>
            ))}

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
        marginBottom: 16,
    },
    saveToLabel: {
        fontWeight: '800',
        letterSpacing: 0.6,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    pageBadge: {
        position: 'absolute',
        top: 16,
        alignSelf: 'center',
        backgroundColor: 'rgba(139, 92, 246, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 25,
    },
    pageBadgeText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 12,
    },
    tray: {
        borderWidth: 1,
        padding: 12,
        marginTop: 14,
    },
    trayRow: {
        gap: 10,
        paddingBottom: 4,
    },
    thumbWrap: {
        alignItems: 'center',
    },
    thumb: {
        width: 64,
        height: 86,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: '#0F172A',
    },
    thumbLabel: {
        fontSize: 11,
        fontWeight: '700',
        marginTop: 4,
    },
    thumbRemove: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    trayActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 12,
    },
    trayButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 9,
    },
    trayPrimary: {
        backgroundColor: '#8B5CF6',
        borderColor: '#8B5CF6',
    },
    trayButtonText: {
        fontWeight: '700',
        fontSize: 13,
    },
    title: {
        fontWeight: '900',
        letterSpacing: -0.6,
    },
    subtitle: {
        fontWeight: '500',
        marginTop: 4,
    },
    scannerViewfinder: {
        height: 300,
        borderWidth: 1,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 15,
        elevation: 4,
    },
    guideCorner: {
        position: 'absolute',
        width: 25,
        height: 25,
        borderColor: '#8B5CF6',
        borderWidth: 2,
        zIndex: 10,
    },
    cornerTopLeft: {
        top: 20,
        left: 20,
        borderBottomWidth: 0,
        borderRightWidth: 0,
    },
    cornerTopRight: {
        top: 20,
        right: 20,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
    },
    cornerBottomLeft: {
        bottom: 20,
        left: 20,
        borderTopWidth: 0,
        borderRightWidth: 0,
    },
    cornerBottomRight: {
        bottom: 20,
        right: 20,
        borderTopWidth: 0,
        borderLeftWidth: 0,
    },
    laserBeam: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        height: 40,
        zIndex: 5,
    },
    gradientLaser: {
        flex: 1,
    },
    permissionBox: {
        alignItems: 'center',
        paddingHorizontal: 40,
        marginBottom: 50,
    },
    permissionText: {
        color: '#CBD5E1',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 10,
    },
    permissionButton: {
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 20,
        marginTop: 14,
    },
    permissionButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 13,
    },
    processingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
    },
    processingText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
        marginTop: 12,
    },
    camControls: {
        position: 'absolute',
        bottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 28,
        zIndex: 30,
    },
    camBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    triggerButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 3,
        borderColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerTriggerCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
    },
    sectionTitle: {
        fontWeight: '800',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    emptyText: {
        fontWeight: '500',
        paddingHorizontal: 4,
        marginTop: -8,
    },
    scanRowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderWidth: 1,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
    },
    fileCircleIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    scanMeta: {
        flex: 1,
    },
    scanTitle: {
        fontWeight: '700',
    },
    scanDetails: {
        fontWeight: '500',
        marginTop: 2,
    },
});

export default ScannerScreen;
