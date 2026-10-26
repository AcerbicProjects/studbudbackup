import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';
import { useGoals } from '../../context/GoalsContext';
import { useAuth } from '../../context/AuthContext';
import DailyGoalsList from './DailyGoalsList';

interface Props {
    onOpenTrack: (date: string) => void;
}

const readFlag = async (key: string) =>
    Platform.OS === 'web' ? globalThis.localStorage.getItem(key) : await SecureStore.getItemAsync(key);
const writeFlag = async (key: string, value: string) => {
    if (Platform.OS === 'web') globalThis.localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
};

// Home's view of TODAY's goals (from the shared GoalsContext) plus a once-a-day in-app
// reminder. The reminder is an in-app banner only: no system notification is scheduled.
export const TodayGoalsCard: React.FC<Props> = ({ onOpenTrack }) => {
    const { colors, borderRadius, typography } = useTheme();
    const { today, goalsFor, isWeekLoading } = useGoals();
    const { user } = useAuth();
    const reminderKey = `goal_reminder_${encodeURIComponent(user?._id || 'anon').replace(/%/g, '_')}`;

    // Date the reminder was last dismissed; null until read from storage
    const [dismissedOn, setDismissedOn] = useState<string | null | undefined>(undefined);

    useEffect(() => {
        readFlag(reminderKey).then((v) => setDismissedOn(v)).catch(() => setDismissedOn(null));
    }, [reminderKey]);

    const goals = goalsFor(today);
    const done = goals.filter((g) => g.completed).length;
    const open = goals.length - done;
    const showReminder = dismissedOn !== undefined && dismissedOn !== today && open > 0 && !isWeekLoading(today);

    const dismiss = () => {
        setDismissedOn(today);
        // If saving fails the banner may show once more next launch; nothing else depends on it
        writeFlag(reminderKey, today).catch(() => {});
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.xl }]}>
            {showReminder && (
                <View style={[styles.reminder, { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderRadius: borderRadius.md }]} accessibilityRole="alert">
                    <MaterialCommunityIcons name="bell-ring-outline" size={18} color="#F59E0B" />
                    <Text style={[styles.reminderText, { color: colors.text }]}>
                        Reminder: you planned {open} {open === 1 ? 'goal' : 'goals'} for today.
                    </Text>
                    <TouchableOpacity onPress={dismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Dismiss reminder">
                        <Text style={styles.reminderAction}>Got it</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text, fontSize: typography.fontSize.md }]}>Today's Goals</Text>
                {goals.length > 0 && (
                    <Text style={[styles.progress, { color: colors.textMuted }]}>{done}/{goals.length} done</Text>
                )}
                <TouchableOpacity onPress={() => onOpenTrack(today)} accessibilityRole="button" accessibilityLabel="Plan goals in Track">
                    <Text style={styles.plan}>{goals.length ? 'Edit' : 'Plan'}</Text>
                </TouchableOpacity>
            </View>

            <DailyGoalsList date={today} variant="compact" limit={3} onShowMore={() => onOpenTrack(today)} />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 4,
        marginBottom: 16,
    },
    reminder: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 10,
        marginBottom: 10,
    },
    reminderText: {
        flex: 1,
        fontSize: 12,
        fontWeight: '600',
    },
    reminderAction: {
        color: '#F59E0B',
        fontWeight: '800',
        fontSize: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        flex: 1,
        fontWeight: '800',
    },
    progress: {
        fontSize: 12,
        fontWeight: '600',
    },
    plan: {
        color: '#8B5CF6',
        fontWeight: '700',
        fontSize: 13,
    },
});

export default TodayGoalsCard;
