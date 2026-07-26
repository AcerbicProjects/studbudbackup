import React, { useRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';
import { AIStackParamList } from '../../types/ai';
import api from '../../lib/api';
import ChatBubble from '../../components/ai/ChatBubble';
import MessageInput from '../../components/ai/MessageInput';
import TypingIndicator from '../../components/ai/TypingIndicator';
import {
    ChatMessage,
    mockChatMessages,
    mockSuggestedPrompts,
    mockCannedResponses,
} from '../../data/mockAIData';

// AI Chat — ask questions about the uploaded notes.
// Week 1: runs fully on mock data; a canned response is appended after a short
// "typing" delay to demo the flow. Real /chat endpoint arrives in Week 3.
export const ChatScreen: React.FC = () => {
    const { colors, typography } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<AIStackParamList>>();

    const route = useRoute<RouteProp<AIStackParamList, 'Chat'>>();
    const { documentId } = route.params;

    const [messages, setMessages] = useState<ChatMessage[]>([{
        id: 'init-msg',
        role: 'ai',
        text: "Hi! I am your StudyBuddy AI. I've read your document. What would you like to know?",
        timestamp: new Date().toISOString()
    }]);
    const [isTyping, setIsTyping] = useState(false);
    const listRef = useRef<FlatList<ChatMessage>>(null);

    const scrollToEnd = () => {
        // Give the list a beat to render the new row first
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    };

    const handleSend = async (text: string) => {
        const userMessage: ChatMessage = {
            id: `u-${Date.now()}`,
            role: 'user',
            text,
            timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setIsTyping(true);
        scrollToEnd();

        try {
            const response = await api.post('/api/ai/chat', {
                documentId,
                message: text
            });

            const reply: ChatMessage = {
                id: `a-${Date.now()}`,
                role: 'ai',
                text: response.data.reply,
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, reply]);
        } catch (error: any) {
            console.error('Chat error:', error);
            const errReply: ChatMessage = {
                id: `a-err-${Date.now()}`,
                role: 'ai',
                text: error.response?.data?.message || 'Sorry, I encountered an error answering that.',
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errReply]);
        } finally {
            setIsTyping(false);
            scrollToEnd();
        }
    };

    const handleRegenerate = async (messageId: string) => {
        // Find the index of the message to regenerate
        const idx = messages.findIndex(m => m.id === messageId);
        if (idx <= 0 || messages[idx].role !== 'ai') return;

        // Use the previous user message as the query
        const prevUserMsg = messages[idx - 1];
        if (prevUserMsg?.role !== 'user') return;

        // Pluck out the regenerating message
        setMessages(prev => prev.filter(m => m.id !== messageId));
        setIsTyping(true);
        scrollToEnd();

        try {
            const response = await api.post('/api/ai/chat', {
                documentId,
                message: prevUserMsg.text + " (Please provide a different or more detailed answer)"
            });

            const reply: ChatMessage = {
                id: `a-${Date.now()}`,
                role: 'ai',
                text: response.data.reply,
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, reply]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsTyping(false);
            scrollToEnd();
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerButton}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: colors.text, fontSize: typography.fontSize.md }]}>
                        AI Study Assistant
                    </Text>
                    <View style={styles.headerSubRow}>
                        <View style={[styles.onlineDot, { backgroundColor: colors.accent }]} />
                        <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                            Physics Notes Chapter 4
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.headerButton}
                    accessibilityRole="button"
                    accessibilityLabel="Chat options"
                >
                    <MaterialCommunityIcons name="dots-vertical" size={22} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={insets.top}
            >
                {/* Messages */}
                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ChatBubble message={item} onRegenerate={handleRegenerate} />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListFooterComponent={
                        isTyping ? (
                            <View style={styles.typingWrap}>
                                <TypingIndicator />
                            </View>
                        ) : null
                    }
                    showsVerticalScrollIndicator={false}
                />

                {/* Suggested prompts */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.promptsRow}
                >
                    {mockSuggestedPrompts.map((prompt) => (
                        <TouchableOpacity
                            key={prompt}
                            style={[
                                styles.promptChip,
                                { backgroundColor: colors.card, borderColor: colors.border },
                            ]}
                            onPress={() => handleSend(prompt)}
                            disabled={isTyping}
                            accessibilityRole="button"
                            accessibilityLabel={`Ask: ${prompt}`}
                        >
                            <MaterialCommunityIcons name="creation" size={13} color={colors.secondary} />
                            <Text style={[styles.promptText, { color: colors.text }]} numberOfLines={1}>
                                {prompt}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Composer */}
                <View style={{ paddingBottom: insets.bottom + 10 }}>
                    <MessageInput onSend={handleSend} disabled={isTyping} />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    headerButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontWeight: '700',
    },
    headerSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 1,
    },
    onlineDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    headerSub: {
        fontSize: 11,
        fontWeight: '500',
    },
    listContent: {
        paddingVertical: 12,
    },
    typingWrap: {
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingLeft: 52, // aligns with AI bubble (avatar width + margins)
    },
    promptsRow: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    promptChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderRadius: 9999,
        paddingHorizontal: 12,
        paddingVertical: 7,
        maxWidth: 260,
    },
    promptText: {
        fontSize: 12,
        fontWeight: '600',
    },
});

export default ChatScreen;
