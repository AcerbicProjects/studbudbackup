import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

interface WeakTopicsScreenProps {
    onBack: () => void;
    onNavigateToTab?: (tabName: string) => void;
}

export const WeakTopicsScreen: React.FC<WeakTopicsScreenProps> = ({ onBack, onNavigateToTab }) => {
    const { colors, typography, borderRadius, shadows, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const [weakTopics, setWeakTopics] = useState([
        {
            id: '1',
            subject: 'Mathematics',
            topic: 'Linear Algebra - Vector Spaces',
            accuracy: 42,
            incorrectCount: 12,
            lastReviewed: '3 days ago',
            color: '#4F46E5',
            icon: 'calculator',
        },
        {
            id: '2',
            subject: 'Physics',
            topic: 'Thermodynamics - Carnot Cycle',
            accuracy: 48,
            incorrectCount: 8,
            lastReviewed: '2 days ago',
            color: '#8B5CF6',
            icon: 'atom',
        },
        {
            id: '3',
            subject: 'Chemistry',
            topic: 'Organic - Aldehydes & Ketones',
            accuracy: 55,
            incorrectCount: 7,
            lastReviewed: '5 days ago',
            color: '#06B6D4',
            icon: 'flask',
        },
    ]);

    const resolvedMilestones = [
        { id: '1', title: 'Resolved: Electrostatics (Physics)', score: '85% Accuracy achieved', date: 'Yesterday' },
        { id: '2', title: 'Resolved: Binary Tree Traversal (Coding)', score: '90% Accuracy achieved', date: '3 days ago' },
    ];

    const handleRemediate = (topicTitle: string, mode: string) => {
        Alert.alert(
            `AI Revision Assistant`,
            `Initiating dynamic ${mode} session for "${topicTitle}". Our AI is analyzing your past mistakes to create a personalized study session.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Start Session', onPress: () => {} }
            ]
        );
    };

    // resolved ring calculation (e.g. 2 out of 5 resolved this week = 40%)
    const resolvedPct = 40;
    const radius = 30;
    const strokeWidth = 6;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (resolvedPct / 100) * circumference;

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            {/* --- HEADER --- */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={onBack}
                    style={styles.backButton}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text, fontSize: typography.fontSize.md }]}>
                    Weak Topic Analysis
                </Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* --- SUMMARY WIDGET --- */}
                <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.xl }, shadows]}>
                    <View style={styles.summaryRow}>
                        <View style={styles.svgWrapper}>
                            <Svg width={80} height={80} viewBox="0 0 80 80">
                                <Circle
                                    cx={40}
                                    cy={40}
                                    r={radius}
                                    stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                                    strokeWidth={strokeWidth}
                                    fill="transparent"
                                />
                                <Circle
                                    cx={40}
                                    cy={40}
                                    r={radius}
                                    stroke="#F59E0B"
                                    strokeWidth={strokeWidth}
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    transform="rotate(-90 40 40)"
                                />
                            </Svg>
                            <View style={styles.svgTextCenter}>
                                <Text style={[styles.svgPctText, { color: colors.text }]}>{resolvedPct}%</Text>
                                <Text style={[styles.svgLabelText, { color: colors.textMuted }]}>Fixed</Text>
                            </View>
                        </View>

                        <View style={styles.summaryInfo}>
                            <Text style={[styles.summaryTitle, { color: colors.text, fontSize: typography.fontSize.sm + 1 }]}>
                                Revision Success Rate
                            </Text>
                            <Text style={[styles.summaryDescription, { color: colors.textMuted, fontSize: typography.fontSize.xs }]}>
                                You have resolved 2 out of 5 core weak topics detected by the AI evaluations this week. Keep it up!
                            </Text>
                        </View>
                    </View>
                </View>

                {/* --- WEAK TOPICS LIST --- */}
                <Text style={[styles.sectionHeading, { color: colors.text, fontSize: typography.fontSize.md + 1 }]}>
                    Priority Revision Areas ({weakTopics.length})
                </Text>

                {weakTopics.map((item) => (
                    <View
                        key={item.id}
                        style={[
                            styles.topicCard,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                borderRadius: borderRadius.xl,
                            },
                            shadows,
                        ]}
                    >
                        {/* Subject Header */}
                        <View style={styles.topicHeader}>
                            <View style={styles.topicHeaderLeft}>
                                <View style={[styles.subjectIconContainer, { backgroundColor: `${item.color}15` }]}>
                                    <MaterialCommunityIcons name={item.icon as any} size={18} color={item.color} />
                                </View>
                                <Text style={[styles.subjectText, { color: item.color }]}>{item.subject}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                <Text style={[styles.statusText, { color: '#EF4444' }]}>Review Needed</Text>
                            </View>
                        </View>

                        {/* Title */}
                        <Text style={[styles.topicTitle, { color: colors.text, fontSize: typography.fontSize.sm + 1 }]}>
                            {item.topic}
                        </Text>

                        {/* Stats Row */}
                        <View style={styles.topicStatsRow}>
                            <Text style={[styles.statDetailText, { color: colors.textMuted }]}>
                                <MaterialCommunityIcons name="alert-circle-outline" /> {item.incorrectCount} mistakes logged
                            </Text>
                            <Text style={[styles.statDetailText, { color: colors.textMuted }]}>
                                <MaterialCommunityIcons name="clock-outline" /> Checked {item.lastReviewed}
                            </Text>
                        </View>

                        {/* Progress Accuracy bar */}
                        <View style={styles.progressSection}>
                            <View style={styles.progressLabels}>
                                <Text style={[styles.progressLabel, { color: colors.textMuted }]}>AI Accuracy Index</Text>
                                <Text style={[styles.progressPct, { color: '#EF4444' }]}>{item.accuracy}%</Text>
                            </View>
                            <View style={[styles.barTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                                <View style={[styles.barFill, { width: `${item.accuracy}%`, backgroundColor: '#EF4444' }]} />
                            </View>
                        </View>

                        {/* Action buttons (Active Recall tools) */}
                        <View style={[styles.actionsDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                onPress={() => handleRemediate(item.topic, 'Quiz')}
                                style={[styles.actionBtn, { borderColor: colors.border }]}
                            >
                                <MaterialCommunityIcons name="head-question-outline" size={16} color="#8B5CF6" />
                                <Text style={[styles.actionBtnText, { color: colors.text }]}>Practice Quiz</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleRemediate(item.topic, 'Chat')}
                                style={[styles.actionBtn, { borderColor: colors.border }]}
                            >
                                <MaterialCommunityIcons name="chat-processing-outline" size={16} color="#4F46E5" />
                                <Text style={[styles.actionBtnText, { color: colors.text }]}>AI Tutor</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                {/* --- RESOLVED MILESTONES --- */}
                <Text style={[styles.sectionHeading, { color: colors.text, fontSize: typography.fontSize.md + 1 }]}>
                    Resolved this Week
                </Text>

                <View style={[styles.resolvedCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.xl }]}>
                    {resolvedMilestones.map((milestone, index) => (
                        <View
                            key={milestone.id}
                            style={[
                                styles.resolvedItem,
                                {
                                    borderBottomWidth: index === resolvedMilestones.length - 1 ? 0 : 1,
                                    borderBottomColor: colors.border,
                                },
                            ]}
                        >
                            <View style={styles.resolvedLeft}>
                                <View style={styles.checkedCircle}>
                                    <MaterialCommunityIcons name="check" size={16} color="#22C55E" />
                                </View>
                                <View>
                                    <Text style={[styles.resolvedTitle, { color: colors.text }]}>{milestone.title}</Text>
                                    <Text style={[styles.resolvedMutedText, { color: colors.textMuted }]}>{milestone.score}</Text>
                                </View>
                            </View>
                            <Text style={[styles.resolvedDate, { color: colors.textMuted }]}>{milestone.date}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    summaryCard: {
        padding: 16,
        borderWidth: 1.5,
        marginTop: 16,
        marginBottom: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    svgWrapper: {
        position: 'relative',
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    svgTextCenter: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    svgPctText: {
        fontSize: 15,
        fontWeight: '900',
    },
    svgLabelText: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    summaryInfo: {
        flex: 1,
        marginLeft: 16,
    },
    summaryTitle: {
        fontWeight: '700',
        marginBottom: 4,
    },
    summaryDescription: {
        fontWeight: '500',
        lineHeight: 15,
    },
    sectionHeading: {
        fontWeight: '800',
        letterSpacing: -0.2,
        marginBottom: 12,
    },
    topicCard: {
        borderWidth: 1.5,
        padding: 16,
        marginBottom: 16,
    },
    topicHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    topicHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    subjectIconContainer: {
        width: 26,
        height: 26,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    subjectText: {
        fontSize: 11,
        fontWeight: '700',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    topicTitle: {
        fontWeight: '800',
        marginBottom: 6,
    },
    topicStatsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 14,
    },
    statDetailText: {
        fontSize: 10,
        fontWeight: '500',
    },
    progressSection: {
        marginBottom: 14,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    progressLabel: {
        fontSize: 10,
        fontWeight: '600',
    },
    progressPct: {
        fontSize: 11,
        fontWeight: '800',
    },
    barTrack: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 3,
    },
    actionsDivider: {
        height: 1,
        marginBottom: 12,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderWidth: 1,
        borderRadius: 8,
        gap: 6,
    },
    actionBtnText: {
        fontSize: 11,
        fontWeight: '700',
    },
    resolvedCard: {
        borderWidth: 1.5,
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    resolvedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    resolvedLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkedCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    resolvedTitle: {
        fontSize: 12,
        fontWeight: '700',
    },
    resolvedMutedText: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 2,
    },
    resolvedDate: {
        fontSize: 10,
        fontWeight: '600',
    },
});

export default WeakTopicsScreen;
