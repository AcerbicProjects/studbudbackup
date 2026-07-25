import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { useTheme } from '../../constants/theme';

// Three bouncing dots shown while the AI is "thinking".
export const TypingIndicator: React.FC = () => {
    const { colors, borderRadius } = useTheme();

    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const bounce = (value: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(value, { toValue: -5, duration: 260, useNativeDriver: true }),
                    Animated.timing(value, { toValue: 0, duration: 260, useNativeDriver: true }),
                    Animated.delay(360 - delay),
                ])
            );

        const animations = [bounce(dot1, 0), bounce(dot2, 120), bounce(dot3, 240)];
        animations.forEach((a) => a.start());

        return () => animations.forEach((a) => a.stop());
    }, [dot1, dot2, dot3]);

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: borderRadius.lg,
                },
            ]}
        >
            {[dot1, dot2, dot3].map((value, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.dot,
                        {
                            backgroundColor: colors.textMuted,
                            transform: [{ translateY: value }],
                        },
                    ]}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderBottomLeftRadius: 4,
        gap: 5,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
});

export default TypingIndicator;
