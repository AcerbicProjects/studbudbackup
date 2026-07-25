import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

// Custom components from the app
import LampRope from '../../components/documents/LampRope';
import QuoteCard from '../../components/documents/QuoteCard';

interface DashboardScreenProps {
    onNavigateToTab: (tabName: string) => void;
    onNavigateToSub: (subScreenName: string) => void;
    onSelectDocument: (docId: string) => void;
}

const { width } = Dimensions.get('window');

// Mock calendar days
const WEEK_DAYS = [
    { label: 'Mon', date: '13', fullDate: '2026-07-13' },
    { label: 'Tue', date: '14', fullDate: '2026-07-14' },
    { label: 'Wed', date: '15', fullDate: '2026-07-15', today: true },
    { label: 'Thu', date: '16', fullDate: '2026-07-16' },
    { label: 'Fri', date: '17', fullDate: '2026-07-17' },
    { label: 'Sat', date: '18', fullDate: '2026-07-18' },
    { label: 'Sun', date: '19', fullDate: '2026-07-19' },
];

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
    onNavigateToTab,
    onNavigateToSub,
    onSelectDocument,
}) => {
    const { colors, typography, borderRadius, shadows, toggleTheme, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const [selectedDate, setSelectedDate] = useState('2026-07-15');
    const [tasks, setTasks] = useState([
        { id: '1', title: 'Revise Vectors in Mathematics', time: '10:00 AM', subject: 'Math', completed: false },
        { id: '2', title: 'Take AI Mock Quiz (Thermodynamics)', time: '02:30 PM', subject: 'Physics', completed: false },
        { id: '3', title: 'Upload Programming Lab 4 code', time: '06:00 PM', subject: 'Coding', completed: true },
    ]);

    const toggleTask = (id: string) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
        );
    };

    // Calculate circular progress metrics for overall daily study (e.g. 4.5/6 hrs = 75%)
    const percentage = 75;
    const radius = 38;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

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
                <View>
                    <Text style={[styles.dateText, { color: colors.textMuted, fontSize: typography.fontSize.xs + 1 }]}>
                        Wednesday, July 15, 2026
                    </Text>
                    <Text style={[styles.welcomeText, { color: colors.text, fontSize: typography.fontSize.xl + 2 }]}>
                        Hi, Alex 👋
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    {/* Theme rope switch toggle */}
                    <View style={styles.lampContainer}>
                        <LampRope onPullTrigger={toggleTheme} />
                    </View>
                    
                    {/* Notification Bell */}
                    <TouchableOpacity
                        onPress={() => onNavigateToSub('Notifications')}
                        style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        accessibilityRole="button"
                        accessibilityLabel="Open Notifications"
                    >
                        <MaterialCommunityIcons name="bell-outline" size={22} color={colors.text} />
                        <View style={styles.unreadBadge} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* --- MOTIVATIONAL CAROUSEL / QUOTE --- */}
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
                            <Text style={[styles.svgLabelText, { color: colors.textMuted }]}>Goal</Text>
                        </View>
                    </View>

                    <View style={styles.goalInfo}>
                        <Text style={[styles.goalHeader, { color: colors.text, fontSize: typography.fontSize.sm + 1 }]}>
                            Daily Study Target
                        </Text>
                        <Text style={[styles.goalTime, { color: colors.primary, fontSize: typography.fontSize.lg + 1 }]}>
                            4.5 hrs <Text style={{ color: colors.textMuted, fontSize: typography.fontSize.sm }}>/ 6.0 hrs</Text>
                        </Text>
                        <Text style={[styles.goalTip, { color: colors.textMuted, fontSize: typography.fontSize.xs }]}>
                            ⚡ Keep pushing! 1.5 hours left to secure your daily streak.
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* --- STATISTICS GRID --- */}
            <View style={styles.statsGrid}>
                {/* Streak Card */}
                <TouchableOpacity
                    onPress={() => onNavigateToSub('ProgressHistory')}
                    style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}
                >
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                        <MaterialCommunityIcons name="fire" size={24} color="#EF4444" />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>5 Days</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Streak</Text>
                </TouchableOpacity>

                {/* Study Time Card */}
                <TouchableOpacity
                    onPress={() => onNavigateToTab('Progress')}
                    style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}
                >
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                        <MaterialCommunityIcons name="clock-outline" size={24} color="#8B5CF6" />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>16.2 hrs</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Study Time</Text>
                </TouchableOpacity>

                {/* Quizzes Taken Card */}
                <TouchableOpacity
                    onPress={() => onNavigateToSub('ProgressHistory')}
                    style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}
                >
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                        <MaterialCommunityIcons name="comment-question-outline" size={24} color="#22C55E" />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>12 Quizzes</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Completed</Text>
                </TouchableOpacity>

                {/* Weak Topics Card */}
                <TouchableOpacity
                    onPress={() => onNavigateToSub('WeakTopics')}
                    style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}
                >
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                        <MaterialCommunityIcons name="alert-decagram-outline" size={24} color="#F59E0B" />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>3 Topics</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Weak Areas</Text>
                </TouchableOpacity>
            </View>

            {/* --- CALENDAR STRIP --- */}
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.fontSize.md + 1 }]}>
                    Calendar Schedule
                </Text>
                <TouchableOpacity onPress={() => onNavigateToSub('StudyPlanner')}>
                    <Text style={[styles.viewAllText, { color: colors.primary, fontSize: typography.fontSize.xs + 1 }]}>
                        View Planner
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.calendarStrip}
            >
                {WEEK_DAYS.map((day) => {
                    const isSelected = selectedDate === day.fullDate;
                    return (
                        <TouchableOpacity
                            key={day.fullDate}
                            onPress={() => setSelectedDate(day.fullDate)}
                            style={[
                                styles.calendarDay,
                                {
                                    backgroundColor: isSelected ? colors.primary : colors.card,
                                    borderColor: isSelected ? colors.primary : colors.border,
                                    borderRadius: borderRadius.md,
                                },
                            ]}
                        >
                            <Text style={[styles.dayLabel, { color: isSelected ? '#FFFFFF' : colors.textMuted }]}>
                                {day.label}
                            </Text>
                            <Text style={[styles.dayDate, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                                {day.date}
                            </Text>
                            {day.today && !isSelected && (
                                <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* --- UPCOMING TASKS --- */}
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.fontSize.md + 1 }]}>
                    Upcoming Tasks
                </Text>
            </View>

            <View style={[styles.tasksContainer, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.xl }]}>
                {tasks.map((task) => (
                    <TouchableOpacity
                        key={task.id}
                        onPress={() => toggleTask(task.id)}
                        style={[styles.taskItem, { borderBottomColor: colors.border }]}
                        activeOpacity={0.8}
                    >
                        <View style={styles.taskLeft}>
                            <MaterialCommunityIcons
                                name={task.completed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                                size={22}
                                color={task.completed ? colors.accent : colors.textMuted}
                            />
                            <View style={styles.taskTextContainer}>
                                <Text style={[
                                    styles.taskTitle,
                                    {
                                        color: colors.text,
                                        textDecorationLine: task.completed ? 'line-through' : 'none',
                                        opacity: task.completed ? 0.6 : 1,
                                    }
                                ]}>
                                    {task.title}
                                </Text>
                                <Text style={[styles.taskTime, { color: colors.textMuted }]}>
                                    {task.time} • {task.subject}
                                </Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                ))}
            </View>

            {/* --- DASHBOARD QUICK LINKS --- */}
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.fontSize.md + 1 }]}>
                    Explore Dashboards
                </Text>
            </View>
            
            <View style={styles.quickLinksGrid}>
                {/* Analytics */}
                <TouchableOpacity
                    onPress={() => onNavigateToTab('Progress')}
                    style={[styles.linkCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}
                >
                    <LinearGradient
                        colors={['rgba(79, 70, 229, 0.1)', 'rgba(79, 70, 229, 0.01)']}
                        style={styles.linkGradient}
                    >
                        <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={28} color="#4F46E5" />
                        <Text style={[styles.linkLabel, { color: colors.text }]}>Analytics</Text>
                        <Text style={[styles.linkSub, { color: colors.textMuted }]}>View study growth</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Weak Topics */}
                <TouchableOpacity
                    onPress={() => onNavigateToSub('WeakTopics')}
                    style={[styles.linkCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}
                >
                    <LinearGradient
                        colors={['rgba(245, 158, 11, 0.1)', 'rgba(245, 158, 11, 0.01)']}
                        style={styles.linkGradient}
                    >
                        <MaterialCommunityIcons name="shield-alert-outline" size={28} color="#F59E0B" />
                        <Text style={[styles.linkLabel, { color: colors.text }]}>Weak Topics</Text>
                        <Text style={[styles.linkSub, { color: colors.textMuted }]}>Review priority topics</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Planner */}
                <TouchableOpacity
                    onPress={() => onNavigateToSub('StudyPlanner')}
                    style={[styles.linkCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}
                >
                    <LinearGradient
                        colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.01)']}
                        style={styles.linkGradient}
                    >
                        <MaterialCommunityIcons name="calendar-clock" size={28} color="#8B5CF6" />
                        <Text style={[styles.linkLabel, { color: colors.text }]}>Study Planner</Text>
                        <Text style={[styles.linkSub, { color: colors.textMuted }]}>Schedule sessions</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Progress History */}
                <TouchableOpacity
                    onPress={() => onNavigateToSub('ProgressHistory')}
                    style={[styles.linkCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}
                >
                    <LinearGradient
                        colors={['rgba(34, 197, 94, 0.1)', 'rgba(34, 197, 94, 0.01)']}
                        style={styles.linkGradient}
                    >
                        <MaterialCommunityIcons name="timeline-clock-outline" size={28} color="#22C55E" />
                        <Text style={[styles.linkLabel, { color: colors.text }]}>History Log</Text>
                        <Text style={[styles.linkSub, { color: colors.textMuted }]}>Logs & accomplishments</Text>
                    </LinearGradient>
                </TouchableOpacity>
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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    lampContainer: {
        width: 32,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    unreadBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
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
        paddingBottom: 10,
        gap: 10,
    },
    calendarDay: {
        width: 50,
        height: 70,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
    todayDot: {
        position: 'absolute',
        bottom: 6,
        width: 5,
        height: 5,
        borderRadius: 2.5,
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
        borderBottomWidth: 1,
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
    quickLinksGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 10,
    },
    linkCard: {
        width: (width - 44) / 2,
        height: 105,
        borderWidth: 1,
        overflow: 'hidden',
    },
    linkGradient: {
        flex: 1,
        padding: 14,
        justifyContent: 'center',
    },
    linkLabel: {
        fontSize: 13,
        fontWeight: '800',
        marginTop: 8,
    },
    linkSub: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 2,
    },
});

export default DashboardScreen;
