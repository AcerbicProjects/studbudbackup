import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const MOTIVATIONAL_QUOTES = [
    { text: "Small progress every day leads to big success.", author: "Anonymous" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Focus raises everything. Master your focus, master your results.", author: "Cal Newport" },
    { text: "It always seems impossible until it is done.", author: "Nelson Mandela" },
    { text: "Deep work is not a rare habit; it is a superpower in progress.", author: "Deep Work" },
];

export const QuoteCard: React.FC = () => {
    const { colors, typography, borderRadius } = useTheme();
    const [quoteIdx, setQuoteIdx] = useState(0);
    const [isBookmarked, setIsBookmarked] = useState(false);

    // Rotation value for the refresh button
    const spinVal = useRef(new Animated.Value(0)).current;

    const handleRefresh = () => {
        // Spin animation
        spinVal.setValue(0);
        Animated.timing(spinVal, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        // Increment index
        setQuoteIdx((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    };

    const spin = spinVal.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const quote = MOTIVATIONAL_QUOTES[quoteIdx] ?? MOTIVATIONAL_QUOTES[0];

    return (
        <View style={[styles.outerContainer, { borderRadius: borderRadius.xl }]}>
            {/* Animated glowing border effect */}
            <LinearGradient
                colors={['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.glowBorder, { borderRadius: borderRadius.xl }]}
            >
                {/* Glassmorphic content layout */}
                <View style={[styles.innerCard, { backgroundColor: colors.card, borderRadius: borderRadius.xl - 1 }]}>

                    {/* Quote layout */}
                    <View style={styles.quoteRow}>
                        <MaterialCommunityIcons name="format-quote-open" size={24} color="#8B5CF6" style={styles.quoteIcon} />
                        <Text style={[styles.quoteText, { color: colors.text, fontSize: typography.fontSize.sm + 1 }]}>
                            {quote.text}
                        </Text>
                    </View>

                    {/* Author and Action buttons row */}
                    <View style={styles.bottomRow}>
                        <Text style={[styles.author, { color: colors.textMuted, fontSize: typography.fontSize.xs }]}>
                            — {quote.author}
                        </Text>

                        <View style={styles.btnGroup}>
                            {/* Refresh Option */}
                            <TouchableOpacity onPress={handleRefresh} style={styles.actionBtn}>
                                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                    <MaterialCommunityIcons name="autorenew" size={18} color="#8B5CF6" />
                                </Animated.View>
                            </TouchableOpacity>

                            {/* Bookmark Option */}
                            <TouchableOpacity onPress={() => setIsBookmarked(!isBookmarked)} style={styles.actionBtn}>
                                <MaterialCommunityIcons
                                    name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                                    size={18}
                                    color={isBookmarked ? '#10B981' : colors.textMuted}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        padding: 1.5, // border width
        marginVertical: 16,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 15,
        elevation: 4,
    },
    glowBorder: {
        width: '100%',
    },
    innerCard: {
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    quoteRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    quoteIcon: {
        marginRight: 6,
        marginTop: -4,
    },
    quoteText: {
        flex: 1,
        lineHeight: 20,
        fontWeight: '600',
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 28,
    },
    author: {
        fontWeight: '500',
        fontStyle: 'italic',
    },
    btnGroup: {
        flexDirection: 'row',
    },
    actionBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.05)',
    },
});

export default QuoteCard;
