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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';
import { AIStackParamList, ChatMessage } from '../../types/ai';
import ChatBubble from '../../components/ai/ChatBubble';
import MessageInput from '../../components/ai/MessageInput';
import TypingIndicator from '../../components/ai/TypingIndicator';
import AIService from '../../services/AIService';
import { getErrorMessage } from '../../services/DocumentService';
import { useAIDocument } from '../../context/AIDocumentContext';

const SUGGESTED_PROMPTS = [
    'Summarize this in 5 points',
    'Explain the hardest concept simply',
    'Give me an example problem',
    'What should I memorize for the exam?',
];

const makeMessage = (role: ChatMessage['role'], text: string): ChatMessage => ({
    id: `${role[0]}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    text,
    timestamp: new Date().toISOString(),
});

// AI Chat — ask questions about the selected document. Answers come from the
// backend, which sends the document text and the recent conversation to the AI.
export const ChatScreen: React.FC = () => {
    const { colors, typography } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<AIStackParamList>>();
    const aiDocument = useAIDocument();

    const [messages, setMessages] = useState<ChatMessage[]>(() => [
        makeMessage(
            'ai',
            `Hi! I've read **${aiDocument.title}**. Ask me anything about it and I'll explain it from your notes.`
        ),
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const listRef = useRef<FlatList<ChatMessage>>(null);

    const scrollToEnd = () => {
        // Give the list a beat to render the new row first
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    };

    // Ask the AI and return its reply, or a friendly error to show in the chat
    const askAI = async (text: string, history: ChatMessage[]) => {
        try {
            return await AIService.chat(aiDocument.id, text, history);
        } catch (err) {
            return `⚠️ ${getErrorMessage(err, 'I could not reach the AI right now. Please try again.')}`;
        }
    };

    const handleSend = async (text: string) => {
        if (isTyping) return;
        const history = messages;
        setMessages((prev) => [...prev, makeMessage('user', text)]);
        setIsTyping(true);
        scrollToEnd();

        const reply = await askAI(text, history);
        setIsTyping(false);
        setMessages((prev) => [...prev, makeMessage('ai', reply)]);
        scrollToEnd();
    };

    const handleRegenerate = async (messageId: string) => {
        if (isTyping) return;
        const index = messages.findIndex((m) => m.id === messageId);
        // Re-ask the user question that produced this answer
        const questionIndex = messages.slice(0, index).map((m) => m.role).lastIndexOf('user');
        if (index < 0 || questionIndex < 0) return;

        setIsTyping(true);
        const reply = await askAI(messages[questionIndex].text, messages.slice(0, questionIndex));
        setIsTyping(false);
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, text: reply } : m)));
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
                        <Text style={[styles.headerSub, { color: colors.textMuted }]} numberOfLines={1}>
                            {aiDocument.title}
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
                        ) : undefined
                    }
                    showsVerticalScrollIndicator={false}
                />

                {/* Suggested prompts */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.promptsRow}
                >
                    {SUGGESTED_PROMPTS.map((prompt) => (
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
