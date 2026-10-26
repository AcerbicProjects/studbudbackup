import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, Pressable, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';
import { useStudyProgress } from '../../context/StudyProgressContext';
import { PomodoroSettings, SETTING_LIMITS } from '../../utils/pomodoro';

interface Props {
    visible: boolean;
    onClose: () => void;
}

type NumericKey = keyof typeof SETTING_LIMITS;

const ROWS: { key: NumericKey; label: string; unit: string; step: number }[] = [
    { key: 'studyMinutes', label: 'Study session', unit: 'min', step: 5 },
    { key: 'shortBreakMinutes', label: 'Short break', unit: 'min', step: 1 },
    { key: 'longBreakMinutes', label: 'Long break', unit: 'min', step: 5 },
    { key: 'longBreakEvery', label: 'Long break every', unit: 'sessions', step: 1 },
];

// Pomodoro durations + break preference. Edits apply from the next phase.
export const PomodoroSettingsSheet: React.FC<Props> = ({ visible, onClose }) => {
    const { colors, borderRadius, typography } = useTheme();
    const { settings, updateSettings, timer } = useStudyProgress();
    const [draft, setDraft] = useState<PomodoroSettings>(settings);

    useEffect(() => {
        if (visible) setDraft(settings);
    }, [visible]);

    const step = (key: NumericKey, delta: number) => {
        const [min, max] = SETTING_LIMITS[key];
        setDraft((d) => ({ ...d, [key]: Math.min(max, Math.max(min, d[key] + delta)) }));
    };

    const handleSave = () => {
        updateSettings(draft);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: borderRadius.xl }]}>
                    <Text style={[styles.title, { color: colors.text, fontSize: typography.fontSize.md + 1 }]}>Pomodoro Settings</Text>

                    {ROWS.map((row) => {
                        const [min, max] = SETTING_LIMITS[row.key];
                        const value = draft[row.key];
                        return (
                            <View key={row.key} style={[styles.row, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.label, { color: colors.text }]}>{row.label}</Text>
                                <View style={styles.stepper}>
                                    <TouchableOpacity
                                        onPress={() => step(row.key, -row.step)}
                                        disabled={value <= min}
                                        style={[styles.stepButton, { borderColor: colors.border, opacity: value <= min ? 0.4 : 1 }]}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Decrease ${row.label}`}
                                    >
                                        <MaterialCommunityIcons name="minus" size={16} color={colors.text} />
                                    </TouchableOpacity>
                                    <Text style={[styles.value, { color: colors.text }]}>
                                        {value} <Text style={{ color: colors.textMuted, fontSize: 11 }}>{row.unit}</Text>
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => step(row.key, row.step)}
                                        disabled={value >= max}
                                        style={[styles.stepButton, { borderColor: colors.border, opacity: value >= max ? 0.4 : 1 }]}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Increase ${row.label}`}
                                    >
                                        <MaterialCommunityIcons name="plus" size={16} color={colors.text} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}

                    <View style={[styles.row, { borderBottomWidth: 0 }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: colors.text }]}>Ask before each break</Text>
                            <Text style={[styles.hint, { color: colors.textMuted }]}>
                                {draft.askBeforeBreak ? 'Choose to take, skip or change the break' : 'Breaks start automatically'}
                            </Text>
                        </View>
                        <Switch
                            value={draft.askBeforeBreak}
                            onValueChange={(v) => setDraft((d) => ({ ...d, askBeforeBreak: v }))}
                            trackColor={{ true: '#8B5CF6', false: colors.border }}
                            thumbColor="#FFF"
                        />
                    </View>

                    {timer.phase !== 'idle' && (
                        <Text style={[styles.hint, { color: colors.textMuted, marginTop: 4 }]}>
                            The current {timer.phase === 'study' ? 'session' : 'break'} keeps its length; changes apply from the next one.
                        </Text>
                    )}

                    <View style={styles.actions}>
                        <TouchableOpacity onPress={onClose} style={styles.actionButton}>
                            <Text style={[styles.actionText, { color: colors.textMuted }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSave} style={[styles.actionButton, styles.primary]}>
                            <Text style={[styles.actionText, { color: '#FFF' }]}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    sheet: {
        width: '100%',
        maxWidth: 380,
        borderWidth: 1,
        padding: 20,
    },
    title: {
        fontWeight: '800',
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
    hint: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    stepButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    value: {
        minWidth: 64,
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '800',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 16,
    },
    actionButton: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
    },
    primary: {
        backgroundColor: '#8B5CF6',
    },
    actionText: {
        fontWeight: '700',
        fontSize: 14,
    },
});

export default PomodoroSettingsSheet;
