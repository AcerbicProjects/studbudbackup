import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface NotificationsScreenProps {
    onBack: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
    const { colors, typography, borderRadius, shadows } = useTheme();
    const insets = useSafeAreaInsets();

    const [filter, setFilter] = useState<'all' | 'alert' | 'spaced_rep' | 'achievement'>('all');
    const [notifications, setNotifications] = useState([
        {
            id: 'n1',
            type: 'spaced_rep',
            title: 'Spaced Repetition Review',
            body: 'Chemistry: Organic Aldehydes (Weak Topic) is due for active recall revision.',
            time: '12m ago',
            unread: true,
            actionLabel: 'Practice Quiz',
            icon: 'cards-outline',
            color: '#06B6D4',
        },
        {
            id: 'n2',
            type: 'achievement',
            title: 'Streak Milestone Unlocked!',
            body: 'Congratulations! You secured a 5-day study goal streak. Keep up the momentum!',
            time: '2h ago',
            unread: true,
            actionLabel: 'View History',
            icon: 'fire',
            color: '#EF4444',
        },
        {
            id: 'n3',
            type: 'alert',
            title: 'AI Mock Quiz Generated',
            body: 'A high-yield quiz has been prepared based on your uploaded "Programming Lab 4" PDF.',
            time: '4h ago',
            unread: false,
            actionLabel: 'Start Test',
            icon: 'head-question-outline',
            color: '#22C55E',
        },
        {
            id: 'n4',
            type: 'alert',
            title: 'Weak Topic Drop Detected',
            body: 'Alert: Physics "Carnot Cycle" accuracy fell below 50% in your last practice evaluation.',
            time: '1d ago',
            unread: false,
            actionLabel: 'Ask Tutor',
            icon: 'shield-alert-outline',
            color: '#F59E0B',
        },
    ]);

    const handleAction = (title: string, action: string) => {
        Alert.alert(
            "Notification Action Triggered",
            `Launching dynamic module for "${title}" using mode "${action}".`,
            [{ text: "OK" }]
        );
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
        Alert.alert("Success", "All notifications marked as read.");
    };

    const filteredNotifications = notifications.filter(n => filter === 'all' || n.type === filter);

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
                    Notifications
                </Text>
                <TouchableOpacity
                    onPress={markAllRead}
                    style={styles.markReadButton}
                    accessibilityRole="button"
                    accessibilityLabel="Mark all read"
                >
                    <MaterialCommunityIcons name="email-open-outline" size={22} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* --- CHIPS FILTERS --- */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsContainer}
                >
                    {(['all', 'alert', 'spaced_rep', 'achievement'] as const).map((type) => {
                        const isSelected = filter === type;
                        const labels = {
                            all: 'All Activities',
                            alert: 'Alerts',
                            spaced_rep: 'Review Cues',
                            achievement: 'Streaks',
                        };

                        return (
                            <TouchableOpacity
                                key={type}
                                onPress={() => setFilter(type)}
                                style={[
                                    styles.chip,
                                    {
                                        backgroundColor: isSelected ? colors.primary : colors.card,
                                        borderColor: colors.border,
                                        borderRadius: borderRadius.md,
                                    }
                                ]}
                            >
                                <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                                    {labels[type]}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* --- ALERTS LIST --- */}
                {filteredNotifications.length === 0 ? (
                    <View style={[styles.emptyContent, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.xl }]}>
                        <MaterialCommunityIcons name="bell-off-outline" size={44} color={colors.textMuted} />
                        <Text style={[styles.emptyText, { color: colors.text, fontSize: typography.fontSize.sm + 1 }]}>
                            Clean Slate!
                        </Text>
                        <Text style={[styles.emptySubText, { color: colors.textMuted }]}>
                            No notifications match this filter. Check back later for review prompts.
                        </Text>
                    </View>
                ) : (
                    filteredNotifications.map((notif) => (
                        <View
                            key={notif.id}
                            style={[
                                styles.notificationCard,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: notif.unread ? colors.primary : colors.border,
                                    borderRadius: borderRadius.xl,
                                    borderLeftColor: notif.color,
                                },
                                shadows,
                            ]}
                        >
                            <View style={styles.cardHeaderRow}>
                                <View style={styles.cardHeaderLeft}>
                                    <View style={[styles.iconContainer, { backgroundColor: `${notif.color}15` }]}>
                                        <MaterialCommunityIcons name={notif.icon as any} size={20} color={notif.color} />
                                    </View>
                                    <Text style={[styles.cardTitle, { color: colors.text, fontSize: typography.fontSize.sm }]}>
                                        {notif.title}
                                    </Text>
                                    {notif.unread && (
                                        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                                    )}
                                </View>
                                <Text style={[styles.timeText, { color: colors.textMuted }]}>{notif.time}</Text>
                            </View>

                            <Text style={[styles.cardBody, { color: colors.textMuted, fontSize: typography.fontSize.xs + 1 }]}>
                                {notif.body}
                            </Text>

                            <View style={[styles.divider, { backgroundColor: colors.border }]} />

                            <View style={styles.cardFooter}>
                                <TouchableOpacity
                                    onPress={() => deleteNotification(notif.id)}
                                    style={[styles.dismissBtn, { borderColor: colors.border }]}
                                >
                                    <MaterialCommunityIcons name="delete-outline" size={16} color={colors.textMuted} />
                                    <Text style={[styles.dismissText, { color: colors.textMuted }]}>Dismiss</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => handleAction(notif.title, notif.actionLabel)}
                                    style={[styles.actionBtn, { backgroundColor: `${notif.color}15` }]}
                                >
                                    <Text style={[styles.actionText, { color: notif.color }]}>{notif.actionLabel}</Text>
                                    <MaterialCommunityIcons name="arrow-right" size={14} color={notif.color} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
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
    markReadButton: {
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
    chipsContainer: {
        paddingVertical: 14,
        gap: 8,
        paddingHorizontal: 2,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        marginRight: 6,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '700',
    },
    emptyContent: {
        borderWidth: 1.5,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    emptyText: {
        fontWeight: '800',
        marginTop: 14,
        marginBottom: 6,
    },
    emptySubText: {
        fontSize: 12,
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 18,
    },
    notificationCard: {
        borderWidth: 1.5,
        borderLeftWidth: 5,
        padding: 16,
        marginBottom: 16,
        position: 'relative',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontWeight: '800',
    },
    unreadDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginLeft: 4,
    },
    timeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    cardBody: {
        fontWeight: '500',
        lineHeight: 17,
        marginBottom: 12,
    },
    divider: {
        height: 1,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dismissBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        gap: 4,
    },
    dismissText: {
        fontSize: 11,
        fontWeight: '700',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        gap: 4,
    },
    actionText: {
        fontSize: 11,
        fontWeight: '800',
    },
});

export default NotificationsScreen;
