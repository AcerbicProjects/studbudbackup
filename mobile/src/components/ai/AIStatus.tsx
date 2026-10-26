import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';
import LoadingSkeleton from './LoadingSkeleton';

interface AILoadingProps {
    message?: string;
}

// Skeleton shown while the AI reads the document
export const AILoading: React.FC<AILoadingProps> = ({ message = 'Reading your document...' }) => {
    const { colors, borderRadius } = useTheme();
    return (
        <View style={styles.wrap}>
            <View style={styles.messageRow}>
                <MaterialCommunityIcons name="creation" size={16} color={colors.secondary} />
                <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
            </View>
            <LoadingSkeleton height={90} radius={borderRadius.lg} style={styles.block} />
            <LoadingSkeleton height={18} width="70%" style={styles.block} />
            <LoadingSkeleton height={18} width="90%" style={styles.block} />
            <LoadingSkeleton height={18} width="55%" style={styles.block} />
            <LoadingSkeleton height={140} radius={borderRadius.lg} style={styles.block} />
        </View>
    );
};

interface AIErrorProps {
    message: string;
    onRetry: () => void;
}

export const AIError: React.FC<AIErrorProps> = ({ message, onRetry }) => {
    const { colors, borderRadius } = useTheme();
    return (
        <View style={[styles.wrap, styles.center]}>
            <View style={[styles.errorIcon, { backgroundColor: `${colors.error}1A` }]}>
                <MaterialCommunityIcons name="robot-confused-outline" size={32} color={colors.error} />
            </View>
            <Text style={[styles.errorTitle, { color: colors.text }]}>Couldn't generate this</Text>
            <Text style={[styles.errorText, { color: colors.textMuted }]}>{message}</Text>
            <TouchableOpacity
                onPress={onRetry}
                style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: borderRadius.round }]}
                accessibilityRole="button"
                accessibilityLabel="Try again"
            >
                <MaterialCommunityIcons name="refresh" size={18} color="#FFF" />
                <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        flex: 1,
        padding: 16,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 14,
    },
    message: {
        fontSize: 13,
        fontWeight: '600',
    },
    block: {
        marginBottom: 12,
    },
    errorIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    errorTitle: {
        fontSize: 17,
        fontWeight: '800',
    },
    errorText: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 19,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 22,
        paddingVertical: 12,
        marginTop: 20,
    },
    retryText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
});
