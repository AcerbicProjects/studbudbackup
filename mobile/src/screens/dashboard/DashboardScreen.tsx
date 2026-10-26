import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

import QuoteCard from '../../components/documents/QuoteCard';
import DailyGoalsList from '../../components/study/DailyGoalsList';
import { useStudyProgress } from '../../context/StudyProgressContext';
import { useDocuments } from '../../context/DocumentsContext';
import { useGoals } from '../../context/GoalsContext';
import { useAuth } from '../../context/AuthContext';
import { addDays, dayKey, parseDayKey, weekStart } from '../../utils/studyProgress';

interface DashboardScreenProps {
    onNavigateToTab: (tabName: string) => void;
    onSelectDocument: (docId: string) => void;
    // Date to open on (e.g. from Home's goals card); defaults to today
    initialDate?: string;
}

const { width } = Dimensions.get('window');

// A quiz best score under this marks the document as a weak topic
const WEAK_SCORE = 60;
// Days count toward the streak once at least this much was studied
const STREAK_MIN_MS = 60 * 1000;

const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
};

const formatHours = (ms: number) => `${(ms / 3600000).toFixed(1)} hrs`;

// Monday-first dates of the week containing `key`
const weekOf = (key: string) => {
    const monday = weekStart(key);
    return Array.from({ length: 7 }, (_, i) => parseDayKey(addDays(monday, i)));
};

// e.g. "Nov 2 – 8, 2026", "Oct 26 – Nov 1, 2026", "Dec 28, 2026 – Jan 3, 2027"
// (built by hand: day+year without month formats inconsistently across platforms)
const weekLabel = (dates: Date[]) => {
    const first = dates[0];
    const last = dates[6];
    const month = (d: Date) => d.toLocaleDateString(undefined, { month: 'short' });
    if (first.getFullYear() !== last.getFullYear()) {
        return `${month(first)} ${first.getDate()}, ${first.getFullYear()} – ${month(last)} ${last.getDate()}, ${last.getFullYear()}`;
    }
    const end = first.getMonth() === last.getMonth() ? `${last.getDate()}` : `${month(last)} ${last.getDate()}`;
    return `${month(first)} ${first.getDate()} – ${end}, ${last.getFullYear()}`;
};

// Consecutive study days ending today (or yesterday, so an unstarted today doesn't break it)
const computeStreak = (days: Record<string, number>) => {
    const cursor = new Date();
    if ((days[dayKey(cursor)] || 0) < STREAK_MIN_MS) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while ((days[dayKey(cursor)] || 0) >= STREAK_MIN_MS) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
};

// Track tab: everything here comes from the Weekly Progress timer and your documents/quizzes
export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigateToTab, onSelectDocument, initialDate }) => {
    const { colors, typography, borderRadius, shadows, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const { milliseconds: weekMs, days, sessions, goalHours, ready, toggle, timer } = useStudyProgress();
    const { documents } = useDocuments();
    const { goalsFor, today: todayKey } = useGoals();
    const { user } = useAuth();
    const firstName = user?.fullName?.trim().split(/\s+/)[0] || 'there';

    const [selectedDate, setSelectedDate] = useState(initialDate || todayKey);
    const week = useMemo(() => weekOf(selectedDate), [selectedDate]);
    const timerActive = timer.phase !== 'idle' && !timer.paused;
    const timerLabel = timer.phase === 'idle' ? 'Start' : timer.paused ? 'Paused' : timer.phase === 'break' ? 'Break' : 'Studying';

    // Daily target is the weekly goal spread over 7 days
    const dailyGoalMs = (goalHours * 3600000) / 7;
    const todayMs = days[todayKey] || 0;
    const percentage = Math.min(100, Math.round((todayMs / dailyGoalMs) * 100));
    const streak = computeStreak(days);

    const quizStats = useMemo(() => {
        const quizzed = documents.filter((d) => d.quizCount > 0);
        const total = quizzed.reduce((sum, d) => sum + d.quizCount, 0);
        const avg = quizzed.length
            ? Math.round(quizzed.reduce((sum, d) => sum + (d.lastQuizScore || 0), 0) / quizzed.length)
            : null;
        return { total, avg };
    }, [documents]);

    const weakDocs = useMemo(
        () =>
            documents
                .filter((d) => d.bestQuizScore !== null && d.bestQuizScore < WEAK_SCORE)
                .sort((a, b) => (a.bestQuizScore ?? 0) - (b.bestQuizScore ?? 0)),
        [documents]
    );

    // Least-covered documents first, so there's always a clear next thing to study
    const upNext = useMemo(
        () => documents.filter((d) => d.progress < 100).sort((a, b) => a.progress - b.progress).slice(0, 3),
        [documents]
    );

    const maxDayMs = Math.max(dailyGoalMs, ...week.map((d) => days[dayKey(d)] || 0));
    const selectedMs = days[selectedDate] || 0;
    const selectedSessions = sessions[selectedDate] || 0;
    const selectedLabel = selectedDate === todayKey
        ? 'today'
        : `on ${parseDayKey(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`;
    const selectedTitle = selectedDate === todayKey
        ? "Today's Goals"
        : `Goals for ${parseDayKey(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`;

    const radius = 38;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const remainingTodayMs = Math.max(0, dailyGoalMs - todayMs);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, 16) }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Ambient background glow */}
            <View style={[
                styles.bgGlow,
                {
                    backgroundColor: isDark ? 'rgba(79, 70, 229, 0.06)' : 'rgba(99, 102, 241, 0.04)',
                    top: insets.top,
                }
            ]} />

            {/* --- HEADER BLOCK --- */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.dateText, { color: colors.textMuted, fontSize: typography.fontSize.xs + 1 }]}>
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </Text>
                    <Text style={[styles.welcomeText, { color: colors.text, fontSize: typography.fontSize.xl + 2 }]}>
                        Hi, {firstName} 👋
                    </Text>
                </View>

                {/* Same timer as Weekly Progress on Home */}
                <TouchableOpacity
                    onPress={toggle}
                    disabled={!ready}
                    style={[
                        styles.timerButton,
                        { backgroundColor: timerActive ? '#8B5CF6' : colors.card, borderColor: timerActive ? '#8B5CF6' : colors.border },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={timerActive ? 'Pause timer' : timer.paused ? 'Resume timer' : 'Start study timer'}
                >
                    <MaterialCommunityIcons name={timerActive ? 'pause' : 'play'} size={18} color={timerActive ? '#FFF' : colors.text} />
                    <Text style={[styles.timerButtonText, { color: timerActive ? '#FFF' : colors.text }]}>
                        {timerLabel}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* --- MOTIVATIONAL QUOTE --- */}
            <QuoteCard />

            {/* --- DAILY GOAL CARD --- */}
            <LinearGradient
                colors={isDark ? ['rgba(30, 41, 59, 0.85)', 'rgba(15, 23, 42, 0.95)'] : ['#FFFFFF', '#EEF2F6']}
                style={[styles.goalCard, { borderColor: colors.border, borderRadius: borderRadius.xl }, shadows]}
            >
                <View style={styles.goalRow}>
                    <View style={styles.svgContainer}>
                        <Svg width={100} height={100} viewBox="0 0 100 100">
                            <Defs>
                                <SvgGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <Stop offset="0%" stopColor="#4F46E5" />
                                    <Stop offset="100%" stopColor="#8B5CF6" />
                                </SvgGradient>
                            </Defs>
                            <Circle
                                cx={50}
                                cy={50}
                                r={radius}
                                stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                                strokeWidth={strokeWidth}
                                fill="transparent"
                            />
                            <Circle
                                cx={50}
                                cy={50}
                                r={radius}
                                stroke="url(#goalGrad)"
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                transform="rotate(-90 50 50)"
                            />
                        </Svg>
                        <View style={styles.svgTextCenter}>
                            <Text style={[styles.svgPercentText, { color: colors.text }]}>{percentage}%</Text>
                            <Text style={[styles.svgLabelText, { color: colors.textMuted }]}>Today</Text>
                        </View>
                    </View>

                    <View style={styles.goalInfo}>
                        <Text style={[styles.goalHeader, { color: colors.text, fontSize: typography.fontSize.sm + 1 }]}>
                            Daily Study Target
                        </Text>
                        <Text style={[styles.goalTime, { color: colors.primary, fontSize: typography.fontSize.lg + 1 }]}>
                            {formatDuration(todayMs)}{' '}
                            <Text style={{ color: colors.textMuted, fontSize: typography.fontSize.sm }}>/ {formatDuration(dailyGoalMs)}</Text>
                        </Text>
                        <Text style={[styles.goalTip, { color: colors.textMuted, fontSize: typography.fontSize.xs }]}>
                            {remainingTodayMs === 0
                                ? '✅ Daily target reached. Nice work!'
                                : `⚡ ${formatDuration(remainingTodayMs)} left today to stay on track for your ${goalHours} hr weekly goal.`}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* --- STATISTICS GRID --- */}
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                        <MaterialCommunityIcons name="fire" size={24} color="#EF4444" />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>{streak} {streak === 1 ? 'Day' : 'Days'}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Study Streak</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                        <MaterialCommunityIcons name="clock-outline" size={24} color="#8B5CF6" />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>{formatHours(weekMs)}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>This Week (goal {goalHours} hrs)</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                        <MaterialCommunityIcons name="comment-question-outline" size={24} color="#22C55E" />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                        {quizStats.total} {quizStats.total === 1 ? 'Quiz' : 'Quizzes'}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                        {quizStats.avg === null ? 'None taken yet' : `Avg latest score ${quizStats.avg}%`}
                    </Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                        <MaterialCommunityIcons name="alert-decagram-outline" size={24} color="#F59E0B" />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                        {weakDocs.length} {weakDocs.length === 1 ? 'Topic' : 'Topics'}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Weak Areas (under {WEAK_SCORE}%)</Text>
                </View>
            </View>

            {/* --- WEEK STRIP (same data as Weekly Progress); arrows move between weeks --- */}
            <View style={styles.sectionHeader}>
                <View style={styles.weekNav}>
                    <TouchableOpacity
                        onPress={() => setSelectedDate(addDays(selectedDate, -7))}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel="Previous week"
                    >
                        <MaterialCommunityIcons name="chevron-left" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.fontSize.md }]}>
                        {weekStart(selectedDate) === weekStart(todayKey) ? 'This Week' : weekLabel(week)}
                    </Text>
                    <TouchableOpacity
                        onPress={() => setSelectedDate(addDays(selectedDate, 7))}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel="Next week"
                    >
                        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text} />
                    </TouchableOpacity>
                </View>
                {weekStart(selectedDate) !== weekStart(todayKey) ? (
                    <TouchableOpacity onPress={() => setSelectedDate(todayKey)}>
                        <Text style={[styles.viewAllText, { color: colors.primary, fontSize: typography.fontSize.xs + 1 }]}>Today</Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={[styles.viewAllText, { color: colors.primary, fontSize: typography.fontSize.xs + 1 }]}>
                        {formatDuration(selectedMs)} {selectedLabel}
                    </Text>
                )}
            </View>

            <View style={styles.calendarStrip}>
                {week.map((date) => {
                    const key = dayKey(date);
                    const isSelected = selectedDate === key;
                    const ms = days[key] || 0;
                    const dayGoals = goalsFor(key);
                    const goalsLeft = dayGoals.filter((g) => !g.completed).length;
                    const barHeight = maxDayMs > 0 ? Math.max(ms > 0 ? 3 : 0, Math.round((ms / maxDayMs) * 22)) : 0;
                    const hitGoal = ms >= dailyGoalMs;
                    return (
                        <TouchableOpacity
                            key={key}
                            onPress={() => setSelectedDate(key)}
                            style={[
                                styles.calendarDay,
                                {
                                    backgroundColor: isSelected ? colors.primary : colors.card,
                                    borderColor: isSelected ? colors.primary : colors.border,
                                    borderRadius: borderRadius.md,
                                },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`${date.toLocaleDateString(undefined, { weekday: 'long' })}: ${formatDuration(ms)} studied`}
                        >
                            <Text style={[styles.dayLabel, { color: isSelected ? '#FFFFFF' : colors.textMuted }]}>
                                {date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3)}
                            </Text>
                            <Text style={[styles.dayDate, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                                {date.getDate()}
                            </Text>
                            {/* Mini bar: study time that day relative to the busiest day / daily target */}
                            <View style={styles.dayBarTrack}>
                                <View
                                    style={[
                                        styles.dayBar,
                                        {
                                            height: barHeight,
                                            backgroundColor: isSelected ? '#FFFFFF' : hitGoal ? colors.accent : '#8B5CF6',
                                        },
                                    ]}
                                />
                            </View>
                            {key === todayKey && !isSelected && (
                                <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />
                            )}
                            {/* Goals planned for that day: count still open, or a tick when all are done */}
                            {dayGoals.length > 0 && (
                                <View style={[styles.goalBadge, { backgroundColor: goalsLeft ? '#F59E0B' : colors.accent }]}>
                                    {goalsLeft ? (
                                        <Text style={styles.goalBadgeText}>{goalsLeft}</Text>
                                    ) : (
                                        <MaterialCommunityIcons name="check" size={9} color="#FFF" />
                                    )}
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* --- GOALS FOR THE SELECTED DAY (shared with Home) --- */}
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.fontSize.md + 1 }]}>
                    {selectedTitle}
                </Text>
                <Text style={[styles.viewAllText, { color: colors.textMuted, fontSize: typography.fontSize.xs + 1 }]}>
                    {formatDuration(selectedMs)} · {selectedSessions} {selectedSessions === 1 ? 'session' : 'sessions'}
                </Text>
            </View>
            <View style={[styles.tasksContainer, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.xl }]}>
                <DailyGoalsList date={selectedDate} />
            </View>

            {/* --- WEAK TOPICS --- */}
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.fontSize.md + 1 }]}>
                    Weak Topics
                </Text>
            </View>

            <View style={[styles.tasksContainer, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.xl }]}>
                {weakDocs.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                        {quizStats.total === 0
                            ? 'Take an AI quiz on a document and any score under 60% shows up here.'
                            : 'No weak topics. Every quizzed document is at 60% or above. 🎉'}
                    </Text>
                ) : (
                    weakDocs.map((doc, index) => (
                        <TouchableOpacity
                            key={doc._id}
                            onPress={() => onSelectDocument(doc._id)}
                            style={[styles.taskItem, { borderBottomColor: colors.border, borderBottomWidth: index === weakDocs.length - 1 ? 0 : 1 }]}
                            activeOpacity={0.8}
                        >
                            <View style={styles.taskLeft}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#F59E0B" />
                                <View style={styles.taskTextContainer}>
                                    <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={1}>
                                        {doc.title}
                                    </Text>
                                    <Text style={[styles.taskTime, { color: colors.textMuted }]}>
                                        Best {doc.bestQuizScore}% • Last {doc.lastQuizScore}% • {doc.subject}
                                    </Text>
                                </View>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    ))
                )}
            </View>

            {/* --- UP NEXT --- */}
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.fontSize.md + 1 }]}>
                    Up Next
                </Text>
                <TouchableOpacity onPress={() => onNavigateToTab('Documents')}>
                    <Text style={[styles.viewAllText, { color: colors.primary, fontSize: typography.fontSize.xs + 1 }]}>
                        All Documents
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.tasksContainer, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.xl }]}>
                {upNext.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                        {documents.length === 0
                            ? 'Upload or scan your notes to get study suggestions.'
                            : 'Everything is fully covered. Upload new material to keep going!'}
                    </Text>
                ) : (
                    upNext.map((doc, index) => (
                        <TouchableOpacity
                            key={doc._id}
                            onPress={() => onSelectDocument(doc._id)}
                            style={[styles.taskItem, { borderBottomColor: colors.border, borderBottomWidth: index === upNext.length - 1 ? 0 : 1 }]}
                            activeOpacity={0.8}
                        >
                            <View style={styles.taskLeft}>
                                <MaterialCommunityIcons
                                    name={doc.quizCount === 0 ? 'checkbox-blank-circle-outline' : 'progress-check'}
                                    size={22}
                                    color={doc.quizCount === 0 ? colors.textMuted : colors.accent}
                                />
                                <View style={styles.taskTextContainer}>
                                    <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={1}>
                                        {doc.title}
                                    </Text>
                                    <Text style={[styles.taskTime, { color: colors.textMuted }]}>
                                        {doc.quizCount === 0 ? 'Not quizzed yet' : `${doc.progress}% covered`} • {doc.subject}
                                    </Text>
                                </View>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 110,
    },
    bgGlow: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 250,
        filter: 'blur(50px)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 12,
    },
    dateText: {
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    welcomeText: {
        fontWeight: '900',
        letterSpacing: -0.6,
        marginTop: 2,
    },
    timerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        marginLeft: 12,
    },
    timerButtonText: {
        fontWeight: '700',
        fontSize: 13,
    },
    goalCard: {
        padding: 16,
        borderWidth: 1.5,
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden',
    },
    goalRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    svgContainer: {
        position: 'relative',
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    svgTextCenter: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    svgPercentText: {
        fontSize: 18,
        fontWeight: '900',
    },
    svgLabelText: {
        fontSize: 10,
        textTransform: 'uppercase',
        fontWeight: '700',
    },
    goalInfo: {
        flex: 1,
        marginLeft: 16,
    },
    goalHeader: {
        fontWeight: '700',
        marginBottom: 2,
    },
    goalTime: {
        fontWeight: '800',
        marginBottom: 6,
    },
    goalTip: {
        fontWeight: '500',
        lineHeight: 15,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        width: (width - 44) / 2,
        padding: 14,
        borderWidth: 1,
        alignItems: 'flex-start',
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 12,
    },
    sectionTitle: {
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    viewAllText: {
        fontWeight: '700',
    },
    calendarStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 10,
    },
    calendarDay: {
        width: (width - 32 - 6 * 6) / 7,
        height: 92,
        borderWidth: 1,
        alignItems: 'center',
        paddingTop: 10,
        position: 'relative',
    },
    dayLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    dayDate: {
        fontSize: 16,
        fontWeight: '800',
        marginTop: 4,
    },
    dayBarTrack: {
        height: 22,
        width: 6,
        justifyContent: 'flex-end',
        marginTop: 6,
    },
    dayBar: {
        width: 6,
        borderRadius: 3,
    },
    todayDot: {
        position: 'absolute',
        bottom: 4,
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    weekNav: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    goalBadge: {
        position: 'absolute',
        top: 3,
        right: 3,
        minWidth: 14,
        height: 14,
        borderRadius: 7,
        paddingHorizontal: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    goalBadgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '800',
    },
    tasksContainer: {
        borderWidth: 1,
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    taskLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    taskTextContainer: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 13,
        fontWeight: '700',
    },
    taskTime: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },
    emptyText: {
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 19,
        paddingVertical: 16,
    },
});

export default DashboardScreen;
