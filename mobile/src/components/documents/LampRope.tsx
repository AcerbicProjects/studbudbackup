import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LampRopeProps {
    onPullTrigger: () => void;
}

// Pull distance (finger movement) that flips the theme mid-gesture
const PULL_THRESHOLD = 40;
// A touch that barely moves counts as a tap on the knob
const TAP_SLOP = 8;

export const LampRope: React.FC<LampRopeProps> = ({ onPullTrigger }) => {
    const { isDark } = useTheme();

    // Animation values
    const pullOffset = useRef(new Animated.Value(0)).current;   // How far the pull rope is dragged down
    const lampGlow = useRef(new Animated.Value(isDark ? 0.8 : 0)).current; // Glow opacity

    // The pan responder is created once, so read the latest callback through a ref
    const triggerRef = useRef(onPullTrigger);
    triggerRef.current = onPullTrigger;
    const firedRef = useRef(false);

    // Track dynamic changes in theme inside animations
    useEffect(() => {
        Animated.timing(lampGlow, {
            toValue: isDark ? 0.9 : 0.05,
            duration: 350,
            useNativeDriver: true,
        }).start();
    }, [isDark]);

    const springBack = () => {
        Animated.spring(pullOffset, {
            toValue: 0,
            friction: 6,
            tension: 120,
            useNativeDriver: true,
        }).start();
    };

    const fire = () => {
        if (firedRef.current) return;
        firedRef.current = true;
        // Let the rope animation start on the native thread before the app re-renders
        requestAnimationFrame(() => triggerRef.current());
    };

    const panResponder = useRef(
        PanResponder.create({
            // Claim the touch before the surrounding ScrollView can, and never hand it back
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponderCapture: () => true,
            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: () => {
                firedRef.current = false;
                pullOffset.stopAnimation();
            },
            onPanResponderMove: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                // Only allow pulling down (positive dy), with a little resistance
                pullOffset.setValue(Math.max(0, gestureState.dy) * 0.6);
                // Flip as soon as the rope is pulled far enough, like a real switch
                if (gestureState.dy > PULL_THRESHOLD) {
                    fire();
                }
            },
            onPanResponderRelease: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
                springBack();
                if (Math.abs(gestureState.dy) < TAP_SLOP && Math.abs(gestureState.dx) < TAP_SLOP) {
                    fire();
                }
            },
            onPanResponderTerminate: springBack,
        })
    ).current;

    return (
        <View style={styles.container}>
            {/* The Lamp Fixture & Light Source (completely fixed) */}
            <View style={styles.lampWrapper}>
                {/* Lamp Base Ceiling Attachment */}
                <View style={[styles.ceilingMount, { backgroundColor: isDark ? '#334155' : '#94A3B8' }]} />

                {/* Light Cord/Rope (fixed height) */}
                <View style={[styles.ropeLine, { backgroundColor: isDark ? '#475569' : '#CBD5E1' }]} />

                {/* Lamp Shade Shield */}
                <View style={[styles.shade, { borderBottomColor: isDark ? '#F59E0B' : '#475569' }]} />

                {/* Warm light emitter (glow) */}
                <Animated.View style={[
                    styles.glowLight,
                    {
                        opacity: lampGlow,
                        shadowColor: '#F59E0B',
                        backgroundColor: 'rgba(245, 158, 11, 0.45)',
                    }
                ]} />

                {/* Pull rope hanging down beside the lamp shade — THIS moves on pull */}
                <Animated.View
                    style={[
                        styles.pullCableContainer,
                        { transform: [{ translateY: pullOffset }] },
                    ]}
                    hitSlop={{ top: 10, bottom: 20, left: 16, right: 16 }}
                    accessibilityRole="switch"
                    accessibilityLabel="Toggle dark mode"
                    accessibilityState={{ checked: isDark }}
                    accessibilityActions={[{ name: 'activate' }]}
                    onAccessibilityAction={() => triggerRef.current()}
                    {...panResponder.panHandlers}
                >
                    {/* Pull cable extension */}
                    <View style={[styles.pullRope, { backgroundColor: isDark ? '#D97706' : '#64748B' }]} />
                    {/* Pull knob handle */}
                    <View style={[styles.pullKnob, { backgroundColor: isDark ? '#F59E0B' : '#475569', borderColor: isDark ? '#FEF08A' : '#E2E8F0' }]}>
                        <MaterialCommunityIcons name="swap-vertical" size={14} color="#FFF" />
                    </View>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        zIndex: 100,
    },
    lampWrapper: {
        alignItems: 'center',
    },
    ceilingMount: {
        width: 28,
        height: 6,
        borderRadius: 3,
    },
    ropeLine: {
        width: 3,
        height: 100,
    },
    shade: {
        width: 70,
        height: 0,
        borderBottomWidth: 40,
        borderBottomColor: '#475569',
        borderLeftWidth: 15,
        borderLeftColor: 'transparent',
        borderRightWidth: 15,
        borderRightColor: 'transparent',
        borderStyle: 'solid',
        marginTop: -2,
        zIndex: 5,
    },
    glowLight: {
        position: 'absolute',
        top: 138,
        width: 140,
        height: 140,
        borderRadius: 70,
        filter: 'blur(30px)',
        zIndex: 2,
    },
    pullCableContainer: {
        alignItems: 'center',
        position: 'absolute',
        top: 40,
        right: -15,
        width: 30,
        paddingTop: 6,
        height: 140,
        zIndex: 10,
        cursor: 'pointer',
    },
    pullRope: {
        width: 2,
        height: 90,
    },
    pullKnob: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
});

export default LampRope;
