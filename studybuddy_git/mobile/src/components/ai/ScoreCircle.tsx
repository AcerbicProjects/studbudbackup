import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../constants/theme';

interface ScoreCircleProps {
    percentage: number; // 0-100
    size?: number;
    strokeWidth?: number;
    label?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Animated circular progress ring showing the quiz score percentage.
export const ScoreCircle: React.FC<ScoreCircleProps> = ({
    percentage,
    size = 170,
    strokeWidth = 13,
    label = 'Score',
}) => {
    const { colors, typography } = useTheme();

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const progress = useRef(new Animated.Value(0)).current;
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        Animated.timing(progress, {
            toValue: percentage,
            duration: 1100,
            useNativeDriver: false, // strokeDashoffset is not a native-driver prop
        }).start();

        const listener = progress.addListener(({ value }) => setDisplayValue(Math.round(value)));
        return () => progress.removeListener(listener);
    }, [percentage, progress]);

    const strokeDashoffset = progress.interpolate({
        inputRange: [0, 100],
        outputRange: [circumference, 0],
    });

    const ringColor =
        percentage >= 70 ? colors.success : percentage >= 40 ? '#F59E0B' : colors.error;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size}>
                {/* Track */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={colors.border}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress ring */}
                <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={ringColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>

            <View style={styles.center}>
                <Text style={[styles.value, { color: colors.text, fontSize: typography.fontSize.h1 }]}>
                    {displayValue}%
                </Text>
                <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    center: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    value: {
        fontWeight: '800',
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginTop: 2,
    },
});

export default ScoreCircle;
