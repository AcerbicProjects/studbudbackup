import React, { useRef, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface FloatingUploadButtonProps {
    onPress: () => void;
}

export const FloatingUploadButton: React.FC<FloatingUploadButtonProps> = ({ onPress }) => {
    const { colors, shadows } = useTheme();

    // Floating idle offset animation
    const floatAnim = useRef(new Animated.Value(0)).current;
    const scaleClick = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -6,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(scaleClick, { toValue: 0.9, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleClick, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    };

    return (
        <Animated.View style={[
            styles.floatingWrapper,
            {
                transform: [{ translateY: floatAnim }, { scale: scaleClick }],
            }
        ]}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
                style={styles.touchArea}
                accessibilityRole="button"
                accessibilityLabel="Upload Document"
            >
                <LinearGradient
                    colors={['#8B5CF6', '#3B82F6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBg}
                >
                    <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    floatingWrapper: {
        position: 'absolute',
        bottom: 90, // safe bottom spacing above custom navbar
        right: 20,
        zIndex: 100,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 18,
        elevation: 8,
    },
    touchArea: {
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
    },
    gradientBg: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.25)',
    },
});

export default FloatingUploadButton;
