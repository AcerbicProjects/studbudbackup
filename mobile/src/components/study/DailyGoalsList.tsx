import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';
import { useGoals, DailyGoal } from '../../context/GoalsContext';

interface Props {
    date: string; // YYYY-MM-DD (local)
    // compact: Home view (tick off only, first `limit` goals); full: Track view (add/edit/delete)
    variant?: 'full' | 'compact';
    limit?: number;
    onShowMore?: () => void;
}

// One list implementation for both screens, reading the shared GoalsContext,
// so a change made in either place shows up in the other immediately.
export const DailyGoalsList: React.FC<Props> = ({ date, variant = 'full', limit = 3, onShowMore }) => {
    const { colors, borderRadius } = useTheme();
    const { goalsFor, loadWeek, isWeekLoading, weekError, addGoal, editGoal, toggleGoal, deleteGoal } = useGoals();
    const [draft, setDraft] = useState('');
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    useEffect(() => {
        loadWeek(date);
    }, [date, loadWeek]);

    // Leaving a date cancels any edit in progress
    useEffect(() => {
        setEditingId(null);
        setDraft('');
    }, [date]);

    const goals = goalsFor(date);
    const loading = isWeekLoading(date) && goals.length === 0;
    const error = weekError(date);
    const compact = variant === 'compact';
    const visible = compact ? goals.slice(0, limit) : goals;

    const report = (title: string) => (err: unknown) =>
        Alert.alert(title, err instanceof Error ? err.message : 'Please try again.');

    const handleAdd = async () => {
        const text = draft.trim();
        if (!text || adding) return;
        setAdding(true);
        try {
            await addGoal(date, text);
            setDraft('');
        } catch (err) {
            report('Goal not saved')(err);
        } finally {
            setAdding(false);
        }
    };

    const startEdit = (goal: DailyGoal) => {
        if (compact || goal.pending) return;
        setEditingId(goal._id);
        setEditText(goal.text);
    };

    const commitEdit = () => {
        const id = editingId;
        const text = editText.trim();
        setEditingId(null);
        if (!id) return;
        const original = goals.find((g) => g._id === id);
        if (!text || !original || text === original.text) return;
        editGoal(id, text).catch(report('Goal not updated'));
    };

    const confirmDelete = (goal: DailyGoal) => {
        Alert.alert('Delete goal?', goal.text, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(goal._id).catch(report('Goal not deleted')) },
        ]);
    };

    if (loading) {
        return <ActivityIndicator color="#8B5CF6" style={{ paddingVertical: 12 }} />;
    }

    return (
        <View>
            {!!error && (
                <TouchableOpacity onPress={() => loadWeek(date)}>
                    <Text style={[styles.error, { color: colors.error }]}>{error} Tap to retry.</Text>
                </TouchableOpacity>
            )}

            {goals.length === 0 && !error && (
                <Text style={[styles.empty, { color: colors.textMuted }]}>
                    {compact ? 'No goals planned for today.' : 'No goals for this day yet. Add one below.'}
                </Text>
            )}

            {visible.map((goal) => (
                <View key={goal._id} style={[styles.row, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                        onPress={() => toggleGoal(goal._id).catch(report('Goal not updated'))}
                        disabled={goal.pending}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: goal.completed }}
                        accessibilityLabel={goal.text}
                    >
                        <MaterialCommunityIcons
                            name={goal.completed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                            size={22}
                            color={goal.completed ? colors.accent : colors.textMuted}
                        />
                    </TouchableOpacity>

                    {editingId === goal._id ? (
                        <TextInput
                            value={editText}
                            onChangeText={setEditText}
                            onSubmitEditing={commitEdit}
                            onBlur={commitEdit}
                            autoFocus
                            maxLength={200}
                            returnKeyType="done"
                            style={[styles.input, styles.flex, { color: colors.text, borderColor: '#8B5CF6', borderRadius: borderRadius.sm }]}
                        />
                    ) : (
                        <TouchableOpacity style={styles.flex} onPress={() => startEdit(goal)} disabled={compact || goal.pending} activeOpacity={0.7}>
                            <Text
                                numberOfLines={compact ? 1 : 3}
                                style={[
                                    styles.goalText,
                                    {
                                        color: colors.text,
                                        textDecorationLine: goal.completed ? 'line-through' : 'none',
                                        opacity: goal.completed || goal.pending ? 0.55 : 1,
                                    },
                                ]}
                            >
                                {goal.text}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {!compact && !goal.pending && editingId !== goal._id && (
                        <TouchableOpacity
                            onPress={() => confirmDelete(goal)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityRole="button"
                            accessibilityLabel={`Delete goal: ${goal.text}`}
                        >
                            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                    {goal.pending && <ActivityIndicator size="small" color="#8B5CF6" />}
                </View>
            ))}

            {compact && goals.length > limit && (
                <TouchableOpacity onPress={onShowMore} style={styles.more}>
                    <Text style={styles.moreText}>+{goals.length - limit} more</Text>
                </TouchableOpacity>
            )}

            {!compact && (
                <View style={styles.addRow}>
                    <TextInput
                        value={draft}
                        onChangeText={setDraft}
                        onSubmitEditing={handleAdd}
                        placeholder="Add a goal, e.g. Revise Data Structures"
                        placeholderTextColor={colors.textMuted}
                        maxLength={200}
                        returnKeyType="done"
                        style={[styles.input, styles.flex, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border, borderRadius: borderRadius.md }]}
                    />
                    <TouchableOpacity
                        onPress={handleAdd}
                        disabled={!draft.trim() || adding}
                        style={[styles.addButton, { opacity: draft.trim() && !adding ? 1 : 0.5 }]}
                        accessibilityRole="button"
                        accessibilityLabel="Add goal"
                    >
                        {adding ? <ActivityIndicator color="#FFF" size="small" /> : <MaterialCommunityIcons name="plus" size={20} color="#FFF" />}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    goalText: {
        fontSize: 13,
        fontWeight: '700',
    },
    input: {
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 13,
    },
    empty: {
        fontSize: 13,
        fontWeight: '500',
        paddingVertical: 12,
    },
    error: {
        fontSize: 12,
        fontWeight: '600',
        paddingVertical: 8,
    },
    addRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#8B5CF6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    more: {
        paddingVertical: 10,
    },
    moreText: {
        color: '#8B5CF6',
        fontWeight: '700',
        fontSize: 12,
    },
});

export default DailyGoalsList;
