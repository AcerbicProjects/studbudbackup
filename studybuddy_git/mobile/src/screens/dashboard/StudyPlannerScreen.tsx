import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, FlatList } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StudyPlannerScreenProps {
    onBack: () => void;
}

interface StudyEvent {
    id: string;
    subject: string;
    topic: string;
    time: string;
    duration: string;
    color: string;
    icon: string;
}

export const StudyPlannerScreen: React.FC<StudyPlannerScreenProps> = ({ onBack }) => {
    const { colors, typography, borderRadius, shadows, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const [selectedDay, setSelectedDay] = useState(15); // Default to July 15
    const [events, setEvents] = useState<Record<number, StudyEvent[]>>({
        14: [
            { id: 'e1', subject: 'Physics', topic: 'Thermodynamics Carnot Cycle', time: '10:00 AM', duration: '1.5 hrs', color: '#8B5CF6', icon: 'atom' },
            { id: 'e2', subject: 'Coding', topic: 'Expo Router Navigation', time: '04:00 PM', duration: '2.0 hrs', color: '#22C55E', icon: 'code-braces' },
        ],
        15: [
            { id: 'e3', subject: 'Mathematics', topic: 'Linear Algebra Vector Spaces', time: '09:00 AM', duration: '2.0 hrs', color: '#4F46E5', icon: 'calculator' },
            { id: 'e4', subject: 'Chemistry', topic: 'Organic Aldehydes Quiz Prep', time: '02:30 PM', duration: '1.5 hrs', color: '#06B6D4', icon: 'flask' },
            { id: 'e5', subject: 'AI', topic: 'Neural Networks Backprop', time: '06:00 PM', duration: '1.0 hr', color: '#F59E0B', icon: 'robot-outline' },
        ],
        16: [
            { id: 'e6', subject: 'Coding', topic: 'Node JS Server Setup', time: '11:00 AM', duration: '2.0 hrs', color: '#22C55E', icon: 'code-braces' },
        ],
        18: [
            { id: 'e7', subject: 'Physics', topic: 'Mock Quiz Revision', time: '03:00 PM', duration: '1.5 hrs', color: '#8B5CF6', icon: 'atom' },
        ]
    });

    const [todoList, setTodoList] = useState([
        { id: 't1', title: 'Prepare Math Viva questions', completed: false },
        { id: 't2', title: 'Upload Physics Carnot PDF', completed: false },
        { id: 't3', title: 'Solve Chemistry mock test', completed: true },
        { id: 't4', title: 'Complete AI flashcards review', completed: true },
    ]);

    // Modal state for adding session
    const [modalVisible, setModalVisible] = useState(false);
    const [newSubject, setNewSubject] = useState('Mathematics');
    const [newTopic, setNewTopic] = useState('');
    const [newTime, setNewTime] = useState('10:00 AM');
    const [newDuration, setNewDuration] = useState('1.5 hrs');

    const handleAddTask = (text: string) => {
        if (!text.trim()) return;
        setTodoList(prev => [
            ...prev,
            { id: Date.now().toString(), title: text, completed: false }
        ]);
    };

    const toggleTodo = (id: string) => {
        setTodoList(prev =>
            prev.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo)
        );
    };

    const handleCreateSession = () => {
        if (!newTopic.trim()) {
            Alert.alert("Error", "Please enter a study topic.");
            return;
        }

        const colorMap: Record<string, string> = {
            'Mathematics': '#4F46E5',
            'Physics': '#8B5CF6',
            'Chemistry': '#06B6D4',
            'Coding': '#22C55E',
            'AI': '#F59E0B',
        };

        const iconMap: Record<string, string> = {
            'Mathematics': 'calculator',
            'Physics': 'atom',
            'Chemistry': 'flask',
            'Coding': 'code-braces',
            'AI': 'robot-outline',
        };

        const newEvent: StudyEvent = {
            id: Date.now().toString(),
            subject: newSubject,
            topic: newTopic,
            time: newTime,
            duration: newDuration,
            color: colorMap[newSubject] || '#8B5CF6',
            icon: iconMap[newSubject] || 'book-open-outline',
        };

        setEvents(prev => ({
            ...prev,
            [selectedDay]: [...(prev[selectedDay] || []), newEvent]
        }));

        setNewTopic('');
        setModalVisible(false);
        Alert.alert("Success", "Study session scheduled successfully!");
    };

    // Calendar Matrix (July 2026 starts on Wed = Index 2)
    const renderCalendar = () => {
        const daysInMonth = 31;
        const startDayIndex = 2; // Wed
        const matrix: (number | null)[] = [];

        // empty pads
        for (let i = 0; i < startDayIndex; i++) {
            matrix.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            matrix.push(i);
        }

        // Add padding to end of week
        while (matrix.length % 7 !== 0) {
            matrix.push(null);
        }

        const weekdayHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

        return (
            <View style={styles.calendarContainer}>
                {/* Headers */}
                <View style={styles.weekdayRow}>
                    {weekdayHeaders.map((h, i) => (
                        <Text key={i} style={[styles.weekdayText, { color: colors.textMuted }]}>{h}</Text>
                    ))}
                </View>

                {/* Days Grid */}
                <View style={styles.daysGrid}>
                    {matrix.map((day, idx) => {
                        if (day === null) {
                            return <View key={`empty-${idx}`} style={styles.dayCell} />;
                        }

                        const hasPlans = events[day] && events[day].length > 0;
                        const isSelected = selectedDay === day;

                        return (
                            <TouchableOpacity
                                key={`day-${day}`}
                                onPress={() => setSelectedDay(day)}
                                style={[
                                    styles.dayCell,
                                    isSelected && { backgroundColor: colors.primary, borderRadius: borderRadius.md }
                                ]}
                            >
                                <Text style={[
                                    styles.dayText,
                                    { color: isSelected ? '#FFFFFF' : colors.text }
                                ]}>
                                    {day}
                                </Text>
                                {hasPlans && !isSelected && (
                                    <View style={[styles.planDot, { backgroundColor: '#8B5CF6' }]} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    const activeDayEvents = events[selectedDay] || [];
    const pendingTodos = todoList.filter(t => !t.completed);
    const completedTodos = todoList.filter(t => t.completed);

    const [todoInput, setTodoInput] = useState('');

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
                    Study Planner
                </Text>
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    style={styles.addButton}
                    accessibilityRole="button"
                    accessibilityLabel="Add Session"
                >
                    <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Calendar Title */}
                <View style={styles.calendarTitleRow}>
                    <Text style={[styles.monthLabel, { color: colors.text, fontSize: typography.fontSize.md }]}>
                        July 2026
                    </Text>
                    <Text style={[styles.subMonthLabel, { color: colors.textMuted }]}>31 days</Text>
                </View>

                {/* Calendar Rendering */}
                <View style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.xl }, shadows]}>
                    {renderCalendar()}
                </View>

                {/* --- DAILY TIMELINE AGENDA --- */}
                <Text style={[styles.sectionHeading, { color: colors.text, fontSize: typography.fontSize.md + 1 }]}>
                    Schedule for July {selectedDay}
                </Text>

                {activeDayEvents.length === 0 ? (
                    <View style={[styles.emptySchedule, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
                        <MaterialCommunityIcons name="calendar-blank-outline" size={32} color={colors.textMuted} />
                        <Text style={[styles.emptyScheduleText, { color: colors.textMuted }]}>
                            No study sessions planned for today. Relax, or schedule one!
                        </Text>
                    </View>
                ) : (
                    <View style={styles.timelineList}>
                        {activeDayEvents.map((evt) => (
                            <View key={evt.id} style={styles.timelineItem}>
                                <View style={styles.timeCol}>
                                    <Text style={[styles.timeText, { color: colors.text }]}>{evt.time}</Text>
                                    <Text style={[styles.durationText, { color: colors.textMuted }]}>{evt.duration}</Text>
                                </View>
                                
                                <View style={styles.bulletCol}>
                                    <View style={[styles.timelineDot, { backgroundColor: evt.color }]} />
                                    <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                                </View>

                                <View style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
                                    <View style={[styles.eventLeftGlow, { backgroundColor: evt.color }]} />
                                    <View style={styles.eventCardContent}>
                                        <View style={styles.eventRow}>
                                            <MaterialCommunityIcons name={evt.icon as any} size={16} color={evt.color} />
                                            <Text style={[styles.eventSubject, { color: evt.color }]}>{evt.subject}</Text>
                                        </View>
                                        <Text style={[styles.eventTopic, { color: colors.text, fontSize: typography.fontSize.sm }]}>
                                            {evt.topic}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* --- TASK CHECKLIST --- */}
                <Text style={[styles.sectionHeading, { color: colors.text, fontSize: typography.fontSize.md + 1 }]}>
                    Today's Checklist
                </Text>

                <View style={[styles.tasksCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.xl }, shadows]}>
                    <View style={styles.taskInputRow}>
                        <TextInput
                            value={todoInput}
                            onChangeText={setTodoInput}
                            placeholder="Add a new checklist task..."
                            placeholderTextColor={colors.textMuted}
                            style={[styles.taskTextInput, { color: colors.text, backgroundColor: colors.inputBg, borderRadius: borderRadius.md }]}
                        />
                        <TouchableOpacity
                            onPress={() => {
                                handleAddTask(todoInput);
                                setTodoInput('');
                            }}
                            style={[styles.taskAddBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.md }]}
                        >
                            <Text style={styles.taskAddBtnText}>Add</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Pending Tasks */}
                    {pendingTodos.map((todo) => (
                        <TouchableOpacity
                            key={todo.id}
                            onPress={() => toggleTodo(todo.id)}
                            style={[styles.todoItem, { borderBottomColor: colors.border }]}
                            activeOpacity={0.8}
                        >
                            <MaterialCommunityIcons name="checkbox-blank-outline" size={20} color={colors.textMuted} />
                            <Text style={[styles.todoTitle, { color: colors.text }]}>{todo.title}</Text>
                        </TouchableOpacity>
                    ))}

                    {/* Completed Divider */}
                    {completedTodos.length > 0 && (
                        <View style={styles.completedHeader}>
                            <Text style={[styles.completedHeaderText, { color: colors.textMuted }]}>Completed</Text>
                        </View>
                    )}

                    {/* Completed Tasks */}
                    {completedTodos.map((todo) => (
                        <TouchableOpacity
                            key={todo.id}
                            onPress={() => toggleTodo(todo.id)}
                            style={[styles.todoItem, { borderBottomColor: colors.border }]}
                            activeOpacity={0.8}
                        >
                            <MaterialCommunityIcons name="checkbox-marked" size={20} color={colors.accent} />
                            <Text style={[styles.todoTitle, { color: colors.textMuted, textDecorationLine: 'line-through' }]}>
                                {todo.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* --- ADD STUDY SESSION MODAL --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: borderRadius.xl }]}>
                        <Text style={[styles.modalTitle, { color: colors.text, fontSize: typography.fontSize.md + 1 }]}>
                            Plan Study Session
                        </Text>

                        {/* Subject Select */}
                        <Text style={[styles.inputLabel, { color: colors.text }]}>Subject</Text>
                        <View style={styles.chipsRow}>
                            {['Mathematics', 'Physics', 'Chemistry', 'Coding', 'AI'].map(sub => {
                                const selected = newSubject === sub;
                                return (
                                    <TouchableOpacity
                                        key={sub}
                                        onPress={() => setNewSubject(sub)}
                                        style={[
                                            styles.modalChip,
                                            {
                                                backgroundColor: selected ? colors.primary : colors.inputBg,
                                                borderRadius: borderRadius.md
                                            }
                                        ]}
                                    >
                                        <Text style={{ color: selected ? '#FFFFFF' : colors.text, fontSize: 11, fontWeight: '700' }}>
                                            {sub}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Topic Input */}
                        <Text style={[styles.inputLabel, { color: colors.text }]}>Topic</Text>
                        <TextInput
                            value={newTopic}
                            onChangeText={setNewTopic}
                            placeholder="e.g. Carnot Engine Revision"
                            placeholderTextColor={colors.textMuted}
                            style={[styles.modalTextInput, { color: colors.text, backgroundColor: colors.inputBg, borderRadius: borderRadius.md }]}
                        />

                        {/* Time Select */}
                        <Text style={[styles.inputLabel, { color: colors.text }]}>Time</Text>
                        <TextInput
                            value={newTime}
                            onChangeText={setNewTime}
                            placeholder="e.g. 10:00 AM"
                            placeholderTextColor={colors.textMuted}
                            style={[styles.modalTextInput, { color: colors.text, backgroundColor: colors.inputBg, borderRadius: borderRadius.md }]}
                        />

                        {/* Duration Select */}
                        <Text style={[styles.inputLabel, { color: colors.text }]}>Duration</Text>
                        <TextInput
                            value={newDuration}
                            onChangeText={setNewDuration}
                            placeholder="e.g. 1.5 hrs"
                            placeholderTextColor={colors.textMuted}
                            style={[styles.modalTextInput, { color: colors.text, backgroundColor: colors.inputBg, borderRadius: borderRadius.md }]}
                        />

                        {/* Buttons Row */}
                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={[styles.modalBtn, { borderColor: colors.border }]}
                            >
                                <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleCreateSession}
                                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                            >
                                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Schedule</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    addButton: {
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
    calendarTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    monthLabel: {
        fontWeight: '800',
    },
    subMonthLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    glassCard: {
        borderWidth: 1.5,
        padding: 16,
        marginBottom: 20,
    },
    calendarContainer: {
        alignItems: 'center',
    },
    weekdayRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    weekdayText: {
        width: 38,
        textAlign: 'center',
        fontSize: 11,
        fontWeight: '700',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
        justifyContent: 'space-between',
    },
    dayCell: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 4,
        position: 'relative',
    },
    dayText: {
        fontSize: 13,
        fontWeight: '700',
    },
    planDot: {
        position: 'absolute',
        bottom: 4,
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    sectionHeading: {
        fontWeight: '800',
        letterSpacing: -0.2,
        marginTop: 10,
        marginBottom: 14,
    },
    emptySchedule: {
        borderWidth: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyScheduleText: {
        fontSize: 12,
        textAlign: 'center',
        fontWeight: '600',
        marginTop: 8,
        lineHeight: 18,
    },
    timelineList: {
        marginBottom: 20,
        paddingLeft: 4,
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 80,
    },
    timeCol: {
        width: 64,
        alignItems: 'flex-start',
        paddingTop: 4,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '800',
    },
    durationText: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 2,
    },
    bulletCol: {
        width: 24,
        alignItems: 'center',
        position: 'relative',
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 6,
        zIndex: 5,
    },
    timelineLine: {
        position: 'absolute',
        top: 16,
        bottom: 0,
        width: 2,
        left: 11, // centered under dot
    },
    eventCard: {
        flex: 1,
        borderWidth: 1,
        marginLeft: 4,
        marginBottom: 12,
        position: 'relative',
        overflow: 'hidden',
    },
    eventLeftGlow: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    eventCardContent: {
        padding: 12,
    },
    eventRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    eventSubject: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    eventTopic: {
        fontWeight: '700',
    },
    tasksCard: {
        borderWidth: 1.5,
        padding: 16,
        marginBottom: 20,
    },
    taskInputRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    taskTextInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        fontWeight: '600',
    },
    taskAddBtn: {
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    taskAddBtnText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 13,
    },
    todoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 12,
    },
    todoTitle: {
        fontSize: 13,
        fontWeight: '700',
    },
    completedHeader: {
        marginTop: 16,
        marginBottom: 8,
        paddingLeft: 2,
    },
    completedHeaderText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderWidth: 1.5,
        padding: 20,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
    },
    modalTitle: {
        fontWeight: '900',
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 6,
        marginTop: 10,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
    },
    modalChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    modalTextInput: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 10,
    },
    modalBtnRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        marginBottom: 10,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBtnText: {
        fontSize: 13,
        fontWeight: '800',
    },
});

export default StudyPlannerScreen;
