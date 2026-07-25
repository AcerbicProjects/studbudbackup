import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { ChatMessage } from '../../data/mockAIData';

interface ChatBubbleProps {
    message: ChatMessage;
    onCopy?: (text: string) => void;
    onRegenerate?: (id: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onCopy, onRegenerate }) => {
    const { colors, borderRadius, typography, isDark } = useTheme();
    const isUser = message.role === 'user';

    const markdownStyles = {
        body: {
            color: colors.text,
            fontSize: typography.fontSize.sm + 1,
            lineHeight: 22,
        },
        strong: { fontWeight: '700' as const },
        code_inline: {
            backgroundColor: colors.inputBg,
            color: colors.secondary,
            borderRadius: 6,
            paddingHorizontal: 4,
            fontSize: typography.fontSize.sm,
        },
        fence: {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(241, 245, 249, 0.9)',
            borderColor: colors.border,
            borderRadius: 12,
            padding: 12,
        },
        bullet_list: { marginTop: 4 },
        ordered_list: { marginTop: 4 },
    };

    return (
        <View style={[styles.row, isUser ? styles.rowUser : styles.rowAI]}>
            {/* AI avatar */}
            {!isUser && (
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <MaterialCommunityIcons name="robot-happy-outline" size={16} color="#FFF" />
                </View>
            )}

            <View style={styles.bubbleColumn}>
                <View
                    style={[
                        styles.bubble,
                        {
                            borderRadius: borderRadius.lg,
                            backgroundColor: isUser ? colors.primary : colors.card,
                            borderColor: isUser ? 'transparent' : colors.border,
                            borderWidth: isUser ? 0 : 1,
                        },
                        isUser ? styles.bubbleUserCorner : styles.bubbleAICorner,
                    ]}
                >
                    {isUser ? (
                        <Text style={[styles.userText, { fontSize: typography.fontSize.sm + 1 }]}>
                            {message.text}
                        </Text>
                    ) : (
                        <Markdown style={markdownStyles}>{message.text}</Markdown>
                    )}
                </View>

                {/* Action row under AI responses */}
                {!isUser && (
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => onCopy?.(message.text)}
                            accessibilityRole="button"
                            accessibilityLabel="Copy response"
                        >
                            <MaterialCommunityIcons name="content-copy" size={14} color={colors.textMuted} />
                            <Text style={[styles.actionLabel, { color: colors.textMuted }]}>Copy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => onRegenerate?.(message.id)}
                            accessibilityRole="button"
                            accessibilityLabel="Regenerate response"
                        >
                            <MaterialCommunityIcons name="refresh" size={15} color={colors.textMuted} />
                            <Text style={[styles.actionLabel, { color: colors.textMuted }]}>Regenerate</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Student avatar */}
            {isUser && (
                <View style={[styles.avatar, styles.avatarUser, { backgroundColor: colors.secondary }]}>
                    <MaterialCommunityIcons name="account" size={16} color="#FFF" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        marginVertical: 6,
        paddingHorizontal: 16,
    },
    rowUser: {
        justifyContent: 'flex-end',
    },
    rowAI: {
        justifyContent: 'flex-start',
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        marginTop: 4,
    },
    avatarUser: {
        marginRight: 0,
        marginLeft: 8,
    },
    bubbleColumn: {
        maxWidth: '78%',
    },
    bubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    bubbleUserCorner: {
        borderBottomRightRadius: 4,
    },
    bubbleAICorner: {
        borderBottomLeftRadius: 4,
    },
    userText: {
        color: '#FFFFFF',
        lineHeight: 22,
    },
    actionsRow: {
        flexDirection: 'row',
        marginTop: 6,
        marginLeft: 4,
        gap: 14,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
});

export default ChatBubble;
