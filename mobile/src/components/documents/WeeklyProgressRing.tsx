import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, TouchableOpacity } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../constants/theme';

import { useStudyProgress } from '../../context/StudyProgressContext';

// Create an animated component wrapper for SVG Circle
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const WeeklyProgressRing: React.FC = () => {
    const { milliseconds, goalHours, running, ready, error, toggle, setGoal } = useStudyProgress();
    const percentage = Math.min(100, Math.floor(milliseconds / (goalHours * 3600000) * 100));
    const seconds = Math.floor(milliseconds / 1000);
    const studyHours = `${Math.floor(seconds / 3600)}h ${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}m ${String(seconds % 60).padStart(2, '0')}s`;
    const remainingMinutes = Math.max(0, Math.ceil((goalHours * 3600000 - milliseconds) / 60000));
    const { colors, typography, borderRadius } = useTheme();

    // Progress metrics
    const radius = 60;
    const strokeWidth = 12;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Animation values
    const animatedValue = useRef(new Animated.Value(circumference)).current;
    const labelScale = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        // Animate outline tracing
        Animated.parallel([
            Animated.spring(animatedValue, {
                toValue: strokeDashoffset,
                tension: 15,
                friction: 6,
                useNativeDriver: false,
            }),
            Animated.spring(labelScale, {
                toValue: 1,
                tension: 25,
                friction: 4,
                useNativeDriver: true,
            })
        ]).start();
    }, [percentage, strokeDashoffset]);

    return (
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: borderRadius.xl }]}>

            {/* Dynamic Grid Layout */}
            <View style={styles.contentRow}>

                {/* SVG Circular Indicator */}
                <View style={styles.svgWrapper}>
                    <Svg width={150} height={150} viewBox="0 0 150 150">
                        <Defs>
                            <LinearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <Stop offset="0%" stopColor="#8B5CF6" />
                                <Stop offset="100%" stopColor="#06B6D4" />
                            </LinearGradient>
                        </Defs>

                        {/* Background Circle Track */}
                        <Circle
                            cx={75}
                            cy={75}
                            r={radius}
                            stroke={colors.border}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                        />

                        {/* Active Circle Indicator */}
                        <AnimatedCircle
                            cx={75}
                            cy={75}
                            r={radius}
                            stroke="url(#progressGrad)"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={animatedValue}
                            strokeLinecap="round"
                            transform="rotate(-90 75 75)"
                        />
                    </Svg>

                    {/* Centered text display inside progress ring */}
                    <Animated.View style={[styles.textCenter, { transform: [{ scale: labelScale }] }]}>
                        <Text style={[styles.pctText, { color: colors.text, fontSize: typography.fontSize.xl }]}>
                            {percentage}%
                        </Text>
                        <Text style={[styles.subPctText, { color: colors.textMuted, fontSize: typography.fontSize.xs }]}>
                            Goal
                        </Text>
                    </Animated.View>
                </View>

                {/* Detailed Stats Column */}
                <View style={styles.statsColumn}>
                    <Text style={[styles.widgetTitle, { color: colors.text, fontSize: typography.fontSize.md - 1 }]}>
                        Weekly Progress
                    </Text>

                    <Text style={[styles.statValue, { color: '#8B5CF6', fontSize: typography.fontSize.lg }]}>
                        {studyHours}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted, fontSize: typography.fontSize.xs }]}>
                        Active study time this week
                    </Text>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <Text style={[styles.tip, { color: colors.text, fontSize: typography.fontSize.xs }]}>
                        {remainingMinutes === 0 ? 'Weekly goal complete! Great work.' : `${remainingMinutes} min to reach your ${goalHours} hr weekly goal.`}
                    </Text>
                </View>

            </View>
            <View accessible accessibilityRole="progressbar" accessibilityLabel="Weekly study goal" accessibilityValue={{ min: 0, max: 100, now: percentage }} style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginTop: 12 }}>
                <View style={{ height: '100%', width: `${percentage}%`, backgroundColor: '#8B5CF6', borderRadius: 4 }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                <TouchableOpacity accessibilityRole="button" disabled={!ready} onPress={toggle} style={{ backgroundColor: '#8B5CF6', borderRadius: 12, padding: 12, opacity: ready ? 1 : 0.5 }}>
                    <Text style={{ color: '#FFF', fontWeight: '700' }}>{!ready ? 'Loading…' : running ? 'Pause studying' : 'Start studying'}</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Decrease weekly goal by one hour" disabled={!ready || goalHours <= 1} onPress={() => setGoal(goalHours - 1)} style={{ padding: 10, opacity: goalHours <= 1 ? 0.4 : 1 }}><Text style={{ color: colors.text, fontSize: 22 }}>−</Text></TouchableOpacity>
                    <Text style={{ color: colors.text }}>{goalHours}h goal</Text>
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Increase weekly goal by one hour" disabled={!ready || goalHours >= 40} onPress={() => setGoal(goalHours + 1)} style={{ padding: 10, opacity: goalHours >= 40 ? 0.4 : 1 }}><Text style={{ color: colors.text, fontSize: 22 }}>+</Text></TouchableOpacity>
                </View>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 10 }}>Monday–Sunday · Timer pauses when the app leaves the foreground.</Text>
            {!!error && <Text accessibilityRole="alert" style={{ color: colors.text, marginTop: 8 }}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    svgWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        width: 155,
        height: 155,
    },
    textCenter: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pctText: {
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    subPctText: {
        fontWeight: '700',
        marginTop: -2,
        textTransform: 'uppercase',
    },
    statsColumn: {
        flex: 1,
        marginLeft: 14,
    },
    widgetTitle: {
        fontWeight: '700',
        marginBottom: 6,
    },
    statValue: {
        fontWeight: '800',
    },
    statLabel: {
        fontWeight: '500',
        marginTop: 1,
    },
    divider: {
        height: 1,
        marginVertical: 10,
        width: '100%',
    },
    tip: {
        fontWeight: '600',
        lineHeight: 16,
    },
});

export default WeeklyProgressRing;
