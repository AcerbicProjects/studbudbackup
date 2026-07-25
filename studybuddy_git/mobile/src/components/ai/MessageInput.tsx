import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MessageInputProps {
    onSend: (text: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
    onSend,
    disabled = false,
    placeholder = 'Ask about your notes...',
}) => {
    const { colors, borderRadius, typography } = useTheme();
    const [text, setText] = useState('');

    const canSend = text.trim().length > 0 && !disabled;

    const handleSend = () => {
        if (!canSend) return;
        onSend(text.trim());
        setText('');
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: borderRadius.xl,
                },
            ]}
        >
            {/* Voice input placeholder — wired up in a later week */}
            <TouchableOpacity
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel="Voice input (coming soon)"
            >
                <MaterialCommunityIcons name="microphone-outline" size={22} color={colors.textMuted} />
            </TouchableOpacity>

            <TextInput
                style={[
                    styles.input,
                    { color: colors.text, fontSize: typography.fontSize.sm + 1 },
                ]}
                value={text}
                onChangeText={setText}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={1000}
                editable={!disabled}
                onSubmitEditing={handleSend}
            />

            <TouchableOpacity
                style={[
                    styles.sendButton,
                    { backgroundColor: canSend ? colors.primary : colors.inputBg },
                ]}
                onPress={handleSend}
                disabled={!canSend}
                accessibilityRole="button"
                accessibilityLabel="Send message"
            >
                <MaterialCommunityIcons
                    name="send"
                    size={18}
                    color={canSend ? '#FFF' : colors.textMuted}
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 6,
        marginHorizontal: 16,
    },
    iconButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        maxHeight: 110,
        paddingHorizontal: 6,
        paddingTop: 8,
        paddingBottom: 8,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default MessageInput;
