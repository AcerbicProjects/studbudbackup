import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';
import { useStudyProgress } from '../../context/StudyProgressContext';

const CUSTOM_OPTIONS = [5, 10, 15, 20];

// Shown once when a study session finishes (rendered a single time, above all tabs).
// Its visibility comes from the timer's persisted `pendingBreak`, so it can't appear twice
// and still appears after a reload if the choice wasn't made yet.
export const BreakPrompt: React.FC = () => {
    const { colors, borderRadius, typography } = useTheme();
    const { pendingBreak, settings, takeBreak, skipBreak, timer } = useStudyProgress();
    const [customOpen, setCustomOpen] = useState(false);

    const visible = !!pendingBreak && timer.phase === 'idle';
    useEffect(() => {
        if (!visible) setCustomOpen(false);
    }, [visible]);

    if (!pendingBreak) return null;
    const suggested = pendingBreak.suggested;
    const minutes = suggested === 'long' ? settings.longBreakMinutes : settings.shortBreakMinutes;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={skipBreak}>
            <View style={styles.backdrop}>
                <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: borderRadius.xl }]}>
                    <View style={[styles.icon, { backgroundColor: 'rgba(34, 197, 94, 0.12)' }]}>
                        <MaterialCommunityIcons name="check-decagram" size={30} color="#22C55E" />
                    </View>
                    <Text style={[styles.title, { color: colors.text, fontSize: typography.fontSize.md + 2 }]}>Session complete!</Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                        {suggested === 'long'
                            ? `That's ${settings.longBreakEvery} sessions. Time for a longer break?`
                            : 'Nice focus. Take a short break before the next session?'}
                    </Text>

                    {customOpen ? (
                        <View style={styles.customRow}>
                            {CUSTOM_OPTIONS.map((m) => (
                                <TouchableOpacity
                                    key={m}
                                    onPress={() => takeBreak('custom', m)}
                                    style={[styles.customChip, { borderColor: '#8B5CF6', borderRadius: borderRadius.md }]}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Take a ${m} minute break`}
                                >
                                    <Text style={styles.customChipText}>{m} min</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => takeBreak(suggested)}
                            style={[styles.button, styles.primary, { borderRadius: borderRadius.round }]}
                            accessibilityRole="button"
                        >
                            <MaterialCommunityIcons name="coffee-outline" size={18} color="#FFF" />
                            <Text style={styles.primaryText}>Take a {minutes}-min {suggested === 'long' ? 'long ' : ''}break</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.secondaryRow}>
                        <TouchableOpacity
                            onPress={() => setCustomOpen((o) => !o)}
                            style={[styles.button, styles.secondary, { borderColor: colors.border, borderRadius: borderRadius.round }]}
                            accessibilityRole="button"
                        >
                            <Text style={[styles.secondaryText, { color: colors.text }]}>{customOpen ? 'Back' : 'Customize break'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={skipBreak}
                            style={[styles.button, styles.secondary, { borderColor: colors.border, borderRadius: borderRadius.round }]}
                            accessibilityRole="button"
                        >
                            <Text style={[styles.secondaryText, { color: colors.text }]}>Skip break</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        borderWidth: 1,
        padding: 22,
        alignItems: 'center',
    },
    icon: {
        width: 60,
        height: 60,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    title: {
        fontWeight: '800',
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 6,
        marginBottom: 18,
        lineHeight: 19,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    primary: {
        backgroundColor: '#8B5CF6',
        alignSelf: 'stretch',
    },
    primaryText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    secondaryRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
        alignSelf: 'stretch',
    },
    secondary: {
        flex: 1,
        borderWidth: 1,
    },
    secondaryText: {
        fontWeight: '700',
        fontSize: 13,
    },
    customRow: {
        flexDirection: 'row',
        gap: 8,
        alignSelf: 'stretch',
        justifyContent: 'space-between',
    },
    customChip: {
        flex: 1,
        borderWidth: 1.5,
        paddingVertical: 11,
        alignItems: 'center',
    },
    customChipText: {
        color: '#8B5CF6',
        fontWeight: '800',
        fontSize: 13,
    },
});

export default BreakPrompt;
