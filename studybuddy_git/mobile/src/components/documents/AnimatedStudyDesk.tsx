import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../constants/theme';

export const AnimatedStudyDesk: React.FC = () => {
    const { colors, isDark } = useTheme();

    // Animations
    const hoverAnim = useRef(new Animated.Value(0)).current;      // coffee steam & plant sway
    const blinkAnim = useRef(new Animated.Value(0)).current;      // student eyes blink
    const breathingAnim = useRef(new Animated.Value(0)).current;  // student torso breathing
    const particle1 = useRef(new Animated.Value(0)).current;       // floating particles
    const particle2 = useRef(new Animated.Value(0)).current;       // floating particles

    useEffect(() => {
        // 1. Hover/Breathe helper loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(hoverAnim, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(hoverAnim, {
                    toValue: 0,
                    duration: 3000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // 2. Breathing loop (subtle y translation)
        Animated.loop(
            Animated.sequence([
                Animated.timing(breathingAnim, {
                    toValue: -3,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(breathingAnim, {
                    toValue: 0,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // 3. Periodic Blink loop
        const blinkInterval = setInterval(() => {
            Animated.sequence([
                Animated.timing(blinkAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
                Animated.timing(blinkAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            ]).start();
        }, 4000);

        // 4. Floating particles sequence loops
        const runParticle1 = () => {
            particle1.setValue(0);
            Animated.timing(particle1, {
                toValue: 1,
                duration: 5000 + Math.random() * 2000,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start(() => runParticle1());
        };

        const runParticle2 = () => {
            particle2.setValue(0);
            Animated.timing(particle2, {
                toValue: 1,
                duration: 6000 + Math.random() * 2000,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start(() => runParticle2());
        };

        runParticle1();
        runParticle2();

        return () => {
            clearInterval(blinkInterval);
        };
    }, []);

    // Steams movement interpolation
    const steamY = hoverAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -12],
    });
    const steamOpacity = hoverAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.8, 1, 0],
    });

    // Eyes scale interpolation
    const eyesScaleY = blinkAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.1],
    });

    // Particle path animations
    const part1TranslateY = particle1.interpolate({
        inputRange: [0, 1],
        outputRange: [40, -100],
    });
    const part1TranslateX = particle1.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 15, -10],
    });
    const part1Opacity = particle1.interpolate({
        inputRange: [0, 0.2, 0.8, 1],
        outputRange: [0, 0.7, 0.7, 0],
    });

    const part2TranslateY = particle2.interpolate({
        inputRange: [0, 1],
        outputRange: [50, -80],
    });
    const part2TranslateX = particle2.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, -20, 15],
    });
    const part2Opacity = particle2.interpolate({
        inputRange: [0, 0.2, 0.8, 1],
        outputRange: [0, 0.8, 0.8, 0],
    });

    // Leaf rotation
    const leafRotate = hoverAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '5deg'],
    });

    return (
        <View style={styles.container}>
            {/* Glow highlight surrounding study setting */}
            <View style={[styles.haloContainer, { opacity: isDark ? 0.35 : 0.15 }]} />

            {/* Floating Dust Particles */}
            <Animated.View style={[
                styles.particle,
                {
                    left: 50,
                    transform: [{ translateY: part1TranslateY }, { translateX: part1TranslateX }],
                    opacity: part1Opacity,
                    backgroundColor: isDark ? '#FEF08A' : '#60A5FA',
                }
            ]} />
            <Animated.View style={[
                styles.particle,
                {
                    right: 60,
                    transform: [{ translateY: part2TranslateY }, { translateX: part2TranslateX }],
                    opacity: part2Opacity,
                    backgroundColor: isDark ? '#FEF08A' : '#34D399',
                }
            ]} />

            {/* Main Illustration Area */}
            <View style={styles.deskContainer}>

                {/* BACKGROUND WINDOW GLOW (LIGHT MODE) */}
                {!isDark && (
                    <View style={styles.windowSunshine}>
                        <View style={styles.sunBeam} />
                        <View style={[styles.sunBeam, { transform: [{ rotate: '-10deg' }], opacity: 0.15 }]} />
                    </View>
                )}

                {/* --- STUDENT --- */}
                <Animated.View style={[
                    styles.studentWrapper,
                    { transform: [{ translateY: breathingAnim }] }
                ]}>
                    {/* Torso/Body */}
                    <View style={[styles.torso, { backgroundColor: isDark ? '#1E1B4B' : '#E0E7FF' }]} />

                    {/* Head & Face */}
                    <View style={[styles.head, { backgroundColor: isDark ? '#F59E0B' : '#FDE047' }]}>
                        {/* Hair */}
                        <View style={[styles.hair, { backgroundColor: isDark ? '#020617' : '#1E293B' }]} />
                        {/* Focused Eyes */}
                        <View style={styles.eyesRow}>
                            <Animated.View style={[styles.eye, { transform: [{ scaleY: eyesScaleY }], backgroundColor: isDark ? '#FED7AA' : '#1E293B' }]} />
                            <Animated.View style={[styles.eye, { transform: [{ scaleY: eyesScaleY }], backgroundColor: isDark ? '#FED7AA' : '#1E293B' }]} />
                        </View>
                        {/* Glasses */}
                        <View style={styles.glassesBridge} />
                        <View style={styles.glassesRimLeft} />
                        <View style={styles.glassesRimRight} />
                    </View>
                </Animated.View>

                {/* --- DESK SURFACE --- */}
                <View style={[styles.tableTop, { backgroundColor: isDark ? '#78350F' : '#D97706' }]} />
                <View style={[styles.tableLeg, { left: 30, backgroundColor: isDark ? '#451A03' : '#92400E' }]} />
                <View style={[styles.tableLeg, { right: 30, backgroundColor: isDark ? '#451A03' : '#92400E' }]} />

                {/* --- LAPTOP --- */}
                <View style={styles.laptopWrapper}>
                    {/* Glow output from screen */}
                    <View style={[
                        styles.screenGlow,
                        { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.45)' : 'rgba(14, 165, 233, 0.2)' }
                    ]} />
                    {/* Laptop Lid/Screen */}
                    <View style={[styles.laptopScreen, { backgroundColor: isDark ? '#1E293B' : '#475569' }]}>
                        <View style={styles.ideMock}>
                            <View style={[styles.ideLine, { width: 30, backgroundColor: '#8B5CF6' }]} />
                            <View style={[styles.ideLine, { width: 45, backgroundColor: '#10B981' }]} />
                            <View style={[styles.ideLine, { width: 25, backgroundColor: '#3B82F6' }]} />
                        </View>
                    </View>
                    {/* Laptop Base */}
                    <View style={[styles.laptopBase, { backgroundColor: isDark ? '#475569' : '#94A3B8' }]} />
                </View>

                {/* --- BOOK STACK --- */}
                <View style={styles.booksWrapper}>
                    <View style={[styles.book, { width: 75, height: 12, backgroundColor: '#EF4444', borderBottomWidth: 2, borderBottomColor: '#B91C1C' }]} />
                    <View style={[styles.book, { width: 68, height: 11, backgroundColor: '#3B82F6', borderBottomWidth: 2, borderBottomColor: '#1D4ED8' }]} />
                    <View style={[styles.book, { width: 60, height: 10, backgroundColor: '#10B981', borderBottomWidth: 2, borderBottomColor: '#047857' }]} />
                </View>

                {/* --- OPEN NOTEBOOK --- */}
                <View style={styles.notebookWrapper}>
                    <View style={styles.notebookPageLeft} />
                    <View style={styles.notebookPageRight} />
                    <View style={styles.notebookSpine} />
                    {/* Tiny writing lines */}
                    <View style={styles.notebookLines} />
                </View>

                {/* --- COFFEE MUG --- */}
                <View style={styles.mugWrapper}>
                    <View style={[styles.mug, { backgroundColor: '#8B5CF6' }]}>
                        <View style={[styles.mugHandle, { borderColor: '#8B5CF6' }]} />
                    </View>
                    {/* Coffee Steam */}
                    <Animated.View style={[
                        styles.steamContainer,
                        {
                            transform: [{ translateY: steamY }],
                            opacity: steamOpacity
                        }
                    ]}>
                        <View style={styles.steamWisp} />
                        <View style={[styles.steamWisp, { left: 4 }]} />
                    </Animated.View>
                </View>

                {/* --- PLANT --- */}
                <Animated.View style={[styles.plantWrapper, { transform: [{ rotate: leafRotate }] }]}>
                    <View style={styles.pot} />
                    <View style={[styles.succulentLeaf, { top: -8, left: 4, transform: [{ rotate: '-15deg' }] }]} />
                    <View style={[styles.succulentLeaf, { top: -8, left: 16, transform: [{ rotate: '15deg' }] }]} />
                    <View style={[styles.succulentLeaf, { top: -14, left: 10 }]} />
                </Animated.View>

                {/* --- PEN HOLDER --- */}
                <View style={styles.penHolder}>
                    <View style={styles.penCup} />
                    <View style={[styles.pen, { transform: [{ rotate: '-12deg' }], backgroundColor: '#3B82F6' }]} />
                    <View style={[styles.pen, { left: 12, transform: [{ rotate: '8deg' }], backgroundColor: '#EF4444' }]} />
                </View>

                {/* --- TASK LIST / STICKY NOTES --- */}
                <View style={styles.stickyNote}>
                    <Text style={styles.stickyText}>✓ Study</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 190,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-end',
        position: 'relative',
    },
    haloContainer: {
        ...StyleSheet.absoluteFill,
        backgroundColor: '#8B5CF6',
        borderRadius: 100,
        filter: 'blur(50px)',
    },
    particle: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
        zIndex: 15,
    },
    deskContainer: {
        width: 290,
        height: 150,
        position: 'relative',
        justifyContent: 'flex-end',
    },
    windowSunshine: {
        position: 'absolute',
        left: -20,
        top: -50,
        width: 140,
        height: 150,
    },
    sunBeam: {
        position: 'absolute',
        backgroundColor: 'rgba(253, 224, 71, 0.08)',
        width: 90,
        height: 200,
        transform: [{ rotate: '-25deg' }],
    },
    // Table
    tableTop: {
        width: '100%',
        height: 12,
        borderRadius: 6,
        zIndex: 10,
    },
    tableLeg: {
        position: 'absolute',
        bottom: -150,
        width: 7,
        height: 150,
        zIndex: 1,
    },
    // Student
    studentWrapper: {
        position: 'absolute',
        left: 80,
        bottom: 12,
        alignItems: 'center',
        zIndex: 5,
    },
    torso: {
        width: 76,
        height: 52,
        borderTopLeftRadius: 38,
        borderTopRightRadius: 38,
    },
    head: {
        width: 32,
        height: 32,
        borderRadius: 16,
        position: 'absolute',
        top: -28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hair: {
        width: 34,
        height: 12,
        borderTopLeftRadius: 17,
        borderTopRightRadius: 17,
        position: 'absolute',
        top: -2,
    },
    eyesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 12,
        marginTop: 6,
    },
    eye: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
    },
    glassesBridge: {
        position: 'absolute',
        top: 9,
        width: 12,
        height: 1.5,
        backgroundColor: '#000',
    },
    glassesRimLeft: {
        position: 'absolute',
        top: 6,
        left: 7,
        width: 7,
        height: 7,
        borderRadius: 3.5,
        borderWidth: 1,
        borderColor: '#000',
    },
    glassesRimRight: {
        position: 'absolute',
        top: 6,
        right: 7,
        width: 7,
        height: 7,
        borderRadius: 3.5,
        borderWidth: 1,
        borderColor: '#000',
    },
    // Laptop
    laptopWrapper: {
        position: 'absolute',
        left: 110,
        bottom: 12,
        alignItems: 'center',
        zIndex: 11,
    },
    screenGlow: {
        position: 'absolute',
        top: -25,
        width: 70,
        height: 45,
        borderRadius: 8,
        filter: 'blur(12px)',
    },
    laptopScreen: {
        width: 58,
        height: 35,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        padding: 3,
    },
    ideMock: {
        flex: 1,
        justifyContent: 'center',
    },
    ideLine: {
        height: 2.5,
        borderRadius: 1,
        marginVertical: 1.5,
    },
    laptopBase: {
        width: 66,
        height: 5,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
    },
    // Books Stack
    booksWrapper: {
        position: 'absolute',
        left: 15,
        bottom: 12,
        alignItems: 'center',
        zIndex: 11,
    },
    book: {
        borderRadius: 2,
        marginBottom: 0.5,
    },
    // Open Notebook
    notebookWrapper: {
        position: 'absolute',
        left: 200,
        bottom: 12,
        width: 52,
        height: 8,
        zIndex: 11,
        backgroundColor: '#CBD5E1',
        flexDirection: 'row',
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
    },
    notebookPageLeft: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        marginRight: 0.5,
        borderTopLeftRadius: 2,
    },
    notebookPageRight: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        marginLeft: 0.5,
        borderTopRightRadius: 2,
    },
    notebookSpine: {
        position: 'absolute',
        left: 25,
        width: 2,
        height: '100%',
        backgroundColor: '#94A3B8',
    },
    notebookLines: {
        position: 'absolute',
        left: 4,
        top: 2,
        width: 14,
        height: 1,
        backgroundColor: '#CBD5E1',
        shadowColor: '#CBD5E1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
    },
    // Coffee Mug
    mugWrapper: {
        position: 'absolute',
        left: 178,
        bottom: 12,
        zIndex: 11,
    },
    mug: {
        width: 13,
        height: 15,
        borderRadius: 2,
        position: 'relative',
    },
    mugHandle: {
        position: 'absolute',
        right: -4,
        top: 3,
        width: 5,
        height: 8,
        borderWidth: 2,
        borderLeftWidth: 0,
        borderRadius: 3,
    },
    steamContainer: {
        position: 'absolute',
        top: -12,
        left: 1,
        flexDirection: 'row',
    },
    steamWisp: {
        width: 1.5,
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 1,
    },
    // Plant pot
    plantWrapper: {
        position: 'absolute',
        right: 15,
        bottom: 12,
        zIndex: 11,
        alignItems: 'center',
    },
    pot: {
        width: 16,
        height: 14,
        backgroundColor: '#CA8A04',
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
    },
    succulentLeaf: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
    },
    // Pen Holder
    penHolder: {
        position: 'absolute',
        left: 255,
        bottom: 12,
        zIndex: 11,
    },
    penCup: {
        width: 12,
        height: 16,
        backgroundColor: '#1E293B',
        borderRadius: 2.5,
    },
    pen: {
        position: 'absolute',
        top: -8,
        width: 2.5,
        height: 12,
        borderRadius: 1,
        left: 4,
    },
    // Sticky Note
    stickyNote: {
        position: 'absolute',
        left: 182,
        bottom: 30,
        backgroundColor: '#FEF08A',
        padding: 3,
        borderRadius: 2,
        transform: [{ rotate: '-12deg' }],
    },
    stickyText: {
        fontSize: 6,
        color: '#854D0E',
        fontWeight: '700',
    },
});

export default AnimatedStudyDesk;
