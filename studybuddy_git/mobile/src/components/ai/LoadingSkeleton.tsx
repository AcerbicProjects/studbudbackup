import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, DimensionValue } from 'react-native';
import { useTheme } from '../../constants/theme';

interface LoadingSkeletonProps {
    width?: DimensionValue;
    height?: number;
    radius?: number;
    style?: object;
}

// Pulsing placeholder block shown while AI content is being generated.
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
    width = '100%',
    height = 16,
    radius = 8,
    style,
}) => {
    const { colors } = useTheme();
    const pulse = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [pulse]);

    return (
        <Animated.View
            style={[
                styles.block,
                {
                    width,
                    height,
                    borderRadius: radius,
                    backgroundColor: colors.border,
                    opacity: pulse,
                },
                style,
            ]}
        />
    );
};

// Pre-composed skeleton for a chat/summary card while it loads.
export const SkeletonCard: React.FC = () => {
    const { colors, borderRadius } = useTheme();

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
            <LoadingSkeleton width="45%" height={14} />
            <LoadingSkeleton width="100%" height={12} style={styles.gap} />
            <LoadingSkeleton width="92%" height={12} style={styles.gap} />
            <LoadingSkeleton width="70%" height={12} style={styles.gap} />
        </View>
    );
};

const styles = StyleSheet.create({
    block: {},
    card: {
        borderWidth: 1,
        padding: 16,
    },
    gap: {
        marginTop: 10,
    },
});

export default LoadingSkeleton;
