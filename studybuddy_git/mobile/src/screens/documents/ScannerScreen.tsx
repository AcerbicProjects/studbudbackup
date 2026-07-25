import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const MOCK_SCANS = [
    { id: 'sc1', title: 'Calculus Formulas.pdf', date: 'Jul 10, 2026', size: '1.4 MB' },
    { id: 'sc2', title: 'Thermodynamics Page 42.pdf', date: 'Jul 8, 2026', size: '850 KB' },
    { id: 'sc3', title: 'Lab Notebook Physics.pdf', date: 'Jul 4, 2026', size: '2.1 MB' },
];

export const ScannerScreen: React.FC = () => {
    const { colors, typography, borderRadius } = useTheme();
    const insets = useSafeAreaInsets();

    const [scansList, setScansList] = useState(MOCK_SCANS);
    const [flashlightOn, setFlashlightOn] = useState(false);

    // Animated value for scanning beam line
    const beamAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Continuous loop of the laser scanning line
        Animated.loop(
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
        ).start();
    }, []);

    const handleCapturePress = () => {
        // Add captured math notes
        const newScan = {
            id: 'sc_' + Date.now(),
            title: `Scan_${scansList.length + 1}_MathNotes.pdf`,
            date: 'Today',
            size: '1.2 MB',
        };
        alert('Document captured! Auto edge cropping completed.');
        setScansList([newScan, ...scansList]);
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
                    Document Scanner
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: typography.fontSize.sm }]}>
                    Snapshot physical worksheets to immediately generate active study summaries
                </Text>
            </View>

            {/* Mock Camera Preview Box */}
            <View style={[
                styles.scannerViewfinder,
                {
                    backgroundColor: '#0F172A', // dark shade always for camera look
                    borderRadius: borderRadius.xl,
                    borderColor: colors.border,
                }
            ]}>
                {/* Transparent grid patterns / Scanner Guideline Marks */}
                <View style={[styles.guideCorner, styles.cornerTopLeft]} />
                <View style={[styles.guideCorner, styles.cornerTopRight]} />
                <View style={[styles.guideCorner, styles.cornerBottomLeft]} />
                <View style={[styles.guideCorner, styles.cornerBottomRight]} />

                {/* Floating Scan Beam Line */}
                <Animated.View style={[
                    styles.laserBeam,
                    { transform: [{ translateY: beamAnim }] }
                ]}>
                    <LinearGradient
                        colors={['rgba(139, 92, 246, 0)', '#8B5CF6', 'rgba(139, 92, 246, 0)']}
                        style={styles.gradientLaser}
                    />
                </Animated.View>

                {/* Viewfinder Mock Math Document Representation */}
                <View style={styles.mathPaperMock}>
                    <Text style={styles.mathLine}>f(x) = ∫ (3x² + sin x) dx</Text>
                    <Text style={[styles.mathLine, { marginTop: 8 }]}>= x³ - cos x + C</Text>
                </View>

                {/* Action icons overlaying camera view */}
                <View style={styles.camControls}>
                    <TouchableOpacity
                        onPress={() => setFlashlightOn(!flashlightOn)}
                        style={[styles.camBtn, { backgroundColor: flashlightOn ? '#F59E0B' : 'rgba(255,255,255,0.1)' }]}
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
                        style={styles.triggerButton}
                    >
                        <View style={styles.innerTriggerCircle} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.camBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                        <MaterialCommunityIcons name="image" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Recent Scans list beneath */}
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.fontSize.md, marginTop: 24 }]}>
                Recent Snaps ({scansList.length})
            </Text>

            {scansList.map((scan) => (
                <View
                    key={scan.id}
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
                        <MaterialCommunityIcons name="file-pdf-box" size={20} color="#FFF" />
                    </View>
                    <View style={styles.scanMeta}>
                        <Text style={[styles.scanTitle, { color: colors.text, fontSize: typography.fontSize.xs + 2 }]}>
                            {scan.title}
                        </Text>
                        <Text style={[styles.scanDetails, { color: colors.textMuted, fontSize: typography.fontSize.xs }]}>
                            {scan.date} • {scan.size}
                        </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                </View>
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
    mathPaperMock: {
        backgroundColor: '#FAF5FF',
        width: 170,
        height: 120,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        opacity: 0.85,
    },
    mathLine: {
        color: '#4C1D95',
        fontFamily: 'monospace',
        fontWeight: '700',
        fontSize: 10,
    },
    camControls: {
        position: 'absolute',
        bottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 28,
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
