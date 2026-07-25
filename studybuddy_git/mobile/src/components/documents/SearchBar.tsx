import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput, View, Animated, TouchableOpacity } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    onVoiceSearchPress?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, onVoiceSearchPress }) => {
    const { colors, borderRadius, typography } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    // Animated scale and border opacity values
    const focusAnim = useRef(new Animated.Value(0)).current;

    const handleFocus = () => {
        setIsFocused(true);
        Animated.timing(focusAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: false,
        }).start();
    };

    const handleBlur = () => {
        setIsFocused(false);
        Animated.timing(focusAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    };

    // Interpolations
    const borderCol = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.border, '#8B5CF6'],
    });

    const baseScale = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.015],
    });

    const glowShadowRadius = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [4, 12],
    });

    return (
        <Animated.View style={[
            styles.animatedContainer,
            {
                backgroundColor: colors.inputBg,
                borderColor: borderCol,
                borderRadius: borderRadius.lg,
                transform: [{ scale: baseScale }],
                shadowRadius: glowShadowRadius,
                shadowColor: '#8B5CF6',
                shadowOpacity: isFocused ? 0.12 : 0.02,
            }
        ]}>
            {/* Search Lens Icon */}
            <MaterialCommunityIcons
                name="magnify"
                size={22}
                color={isFocused ? '#8B5CF6' : colors.textMuted}
                style={styles.searchIcon}
            />

            <TextInput
                style={[styles.input, { color: colors.text, fontSize: typography.fontSize.sm }]}
                placeholder="Search notes, PDFs, lectures..."
                placeholderTextColor={colors.textMuted}
                value={value}
                onChangeText={onChangeText}
                onFocus={handleFocus}
                onBlur={handleBlur}
                accessibilityRole="search"
            />

            {/* Voice Assistant / Mic Option */}
            <TouchableOpacity
                onPress={onVoiceSearchPress}
                style={styles.micButton}
                accessibilityRole="button"
                accessibilityLabel="Voice search"
            >
                <MaterialCommunityIcons
                    name="microphone-outline"
                    size={20}
                    color={isFocused ? '#8B5CF6' : colors.textMuted}
                />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    animatedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderWidth: 1,
        paddingHorizontal: 12,
        marginVertical: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: '100%',
        padding: 0, // resets default OS padding
        fontWeight: '500',
    },
    micButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
});

export default SearchBar;
