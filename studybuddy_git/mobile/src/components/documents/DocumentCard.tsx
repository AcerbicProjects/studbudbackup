import React, { useRef } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Animated, Share, Alert } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type DocumentMock = {
    id: string;
    title: string;
    subject: string;
    pages: number;
    lastOpened: string;
    studyTime: string;
    progress: number;
    favorite: boolean;
    fileSize?: string;
};

interface DocumentCardProps {
    document: DocumentMock;
    onPress: () => void;
    onFavoriteChange?: (id: string) => void;
    onMenuPress?: (doc: DocumentMock) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
    document,
    onPress,
    onFavoriteChange,
    onMenuPress
}) => {
    const { colors, typography, borderRadius, shadows } = useTheme();

    // Animation values for 3D Press Scale & Tilt
    const pressScale = useRef(new Animated.Value(1)).current;
    const tiltX = useRef(new Animated.Value(0)).current;
    const tiltY = useRef(new Animated.Value(0)).current;

    // Track colors for subjects
    const getSubjectColor = (subj: string) => {
        switch (subj.toLowerCase()) {
            case 'mathematics': return '#F59E0B';
            case 'physics': return '#EF4444';
            case 'chemistry': return '#10B981';
            case 'biology': return '#EC4899';
            case 'programming': return '#3B82F6';
            case 'ai': return '#8B5CF6';
            default: return '#6366F1';
        }
    };

    const handleTouchStart = () => {
        Animated.parallel([
            Animated.spring(pressScale, { toValue: 0.96, useNativeDriver: true }),
            Animated.spring(tiltX, { toValue: -4, useNativeDriver: true }),
            Animated.spring(tiltY, { toValue: 2, useNativeDriver: true }),
        ]).start();
    };

    const handleTouchEnd = () => {
        Animated.parallel([
            Animated.spring(pressScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
            Animated.spring(tiltX, { toValue: 0, friction: 3, useNativeDriver: true }),
            Animated.spring(tiltY, { toValue: 0, friction: 3, useNativeDriver: true }),
        ]).start();
    };

    const subjColor = getSubjectColor(document.subject);

    // Combine transformations
    const animatedStyles = {
        transform: [
            { scale: pressScale },
            { perspective: 1000 }, // enables 3D feel
            { rotateX: tiltX.interpolate({ inputRange: [-10, 10], outputRange: ['-5deg', '5deg'] }) },
            { rotateY: tiltY.interpolate({ inputRange: [-10, 10], outputRange: ['-5deg', '5deg'] }) },
        ],
    };

    return (
        <Animated.View
            style={[
                styles.cardContainer,
                {
                    backgroundColor: colors.card,
                    borderRadius: borderRadius.xl,
                    borderColor: colors.border,
                },
                animatedStyles
            ]}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            <TouchableOpacity
                activeOpacity={1} // Disable default opacity since we handle tilt and scale
                onPress={onPress}
                style={styles.touchArea}
            >
                {/* Document Header Representation (Thumbnail preview mockup) */}
                <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.inputBg }]}>
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.06)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <MaterialCommunityIcons name="file-pdf-box" size={48} color={subjColor} />

                    {/* Subject badge indicator */}
                    <View style={[styles.subjectBadge, { backgroundColor: subjColor }]}>
                        <Text style={styles.badgeText}>{document.subject}</Text>
                    </View>
                </View>

                {/* Content details */}
                <View style={styles.detailsContent}>
                    <View style={styles.titleRow}>
                        <Text
                            numberOfLines={1}
                            style={[styles.title, { color: colors.text, fontSize: typography.fontSize.sm + 1 }]}
                        >
                            {document.title}
                        </Text>

                        {/* Context option list */}
                        <TouchableOpacity
                            onPress={() => onMenuPress?.(document)}
                            style={styles.menuIconButton}
                            accessibilityRole="button"
                            accessibilityLabel="Options"
                        >
                            <MaterialCommunityIcons name="dots-horizontal" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {/* Document metadata info line */}
                    <Text style={[styles.metadataText, { color: colors.textMuted, fontSize: typography.fontSize.xs }]}>
                        {document.pages} Pages • Last read {document.lastOpened} • {document.studyTime}
                    </Text>

                    {/* Progress bar widget */}
                    <View style={styles.progressRow}>
                        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${document.progress}%`,
                                        backgroundColor: subjColor
                                    }
                                ]}
                            />
                        </View>
                        <View style={styles.progressDetails}>
                            <Text style={[styles.pctText, { color: colors.text }]}>{document.progress}%</Text>

                            {/* Bookmark Toggle Icon */}
                            <TouchableOpacity
                                onPress={() => onFavoriteChange?.(document.id)}
                                style={styles.favoriteButton}
                                accessibilityRole="button"
                                accessibilityLabel="Bookmark document"
                            >
                                <MaterialCommunityIcons
                                    name={document.favorite ? "bookmark" : "bookmark-outline"}
                                    size={18}
                                    color={document.favorite ? subjColor : colors.textMuted}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// SVG-like helper component to overlay on the thumbnail design
const LinearGradient: React.FC<{ colors: string[]; style: any; children?: React.ReactNode }> = ({ children, style }) => {
    return (
        <View style={[style, { overflow: 'hidden' }]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        borderWidth: 1,
        marginVertical: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden',
    },
    touchArea: {
        padding: 12,
    },
    thumbnailPlaceholder: {
        height: 110,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        position: 'relative',
    },
    subjectBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    detailsContent: {
        marginTop: 2,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontWeight: '700',
        flex: 1,
        marginRight: 6,
    },
    menuIconButton: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metadataText: {
        fontWeight: '500',
        marginTop: 2,
        marginBottom: 8,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    progressTrack: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        marginRight: 10,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pctText: {
        fontSize: 11,
        fontWeight: '700',
        marginRight: 8,
    },
    favoriteButton: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default DocumentCard;
