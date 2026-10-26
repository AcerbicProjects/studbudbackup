import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions, Modal, Pressable } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavBarProps {
    currentTab: string;
    onTabChange: (tab: string) => void;
}

const { width } = Dimensions.get('window');

// Four destinations plus one central "add" action (scan or upload) instead of
// separate Scan/Upload tabs and a floating button competing with the bar.
type Slot = { name: string; icon: string; label: string } | 'action';
const SLOTS: Slot[] = [
    { name: 'Home', icon: 'home-variant', label: 'Home' },
    { name: 'Documents', icon: 'file-document', label: 'Docs' },
    'action',
    { name: 'Progress', icon: 'trending-up', label: 'Track' },
    { name: 'Profile', icon: 'account', label: 'Profile' },
];
// Screens reached through the add button
const ACTION_TABS = ['Scan', 'Upload'];

const ACTIONS = [
    { tab: 'Scan', icon: 'camera-document', title: 'Scan pages', subtitle: 'Capture notes and save them as a PDF', color: '#8B5CF6' },
    { tab: 'Upload', icon: 'file-upload-outline', title: 'Upload a file', subtitle: 'PDF, image or text from your phone or cloud', color: '#3B82F6' },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentTab, onTabChange }) => {
    const { colors, borderRadius, typography } = useTheme();
    const insets = useSafeAreaInsets();
    const [sheetVisible, setSheetVisible] = useState(false);

    // Width calculation per slot
    const barPadding = 12;
    const navBarWidth = width - 32; // fits screen with horizontal margin
    const tabWidth = (navBarWidth - (barPadding * 2)) / SLOTS.length;

    // Track the slot of the selected tab (hidden while on Scan/Upload)
    const selectedIndex = SLOTS.findIndex((s) => s !== 'action' && s.name === currentTab);
    const actionActive = ACTION_TABS.includes(currentTab);

    // Position transition of active background highlight
    const sliderPosition = useRef(new Animated.Value(Math.max(0, selectedIndex) * tabWidth)).current;

    useEffect(() => {
        if (selectedIndex < 0) return;
        Animated.spring(sliderPosition, {
            toValue: selectedIndex * tabWidth,
            friction: 6,
            tension: 30,
            useNativeDriver: true,
        }).start();
    }, [selectedIndex, tabWidth]);

    const openAction = (tab: string) => {
        setSheetVisible(false);
        onTabChange(tab);
    };

    const bottom = Math.max(insets.bottom, 12);

    return (
        <>
            <View style={[
                styles.floatingBar,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    bottom,
                    width: navBarWidth,
                    borderRadius: borderRadius.round,
                }
            ]}>
                {/* Sliding Glass pill element behind the active icon */}
                {selectedIndex >= 0 && (
                    <Animated.View style={[
                        styles.sliderBackdrop,
                        {
                            width: tabWidth,
                            transform: [{ translateX: sliderPosition }],
                            backgroundColor: 'rgba(139, 92, 246, 0.16)', // warm purple glow tint
                            borderColor: 'rgba(139, 92, 246, 0.4)',
                            borderRadius: borderRadius.round,
                        }
                    ]} />
                )}

                {SLOTS.map((slot) => {
                    if (slot === 'action') {
                        return (
                            <View key="action" style={[styles.tabStyle, { width: tabWidth }]}>
                                <TouchableOpacity
                                    onPress={() => setSheetVisible(true)}
                                    activeOpacity={0.85}
                                    style={styles.actionTouch}
                                    accessibilityRole="button"
                                    accessibilityLabel="Add a document: scan or upload"
                                >
                                    <LinearGradient
                                        colors={['#8B5CF6', '#3B82F6']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={[styles.actionButton, actionActive && styles.actionButtonActive]}
                                    >
                                        <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        );
                    }

                    const isActive = slot.name === currentTab;
                    return (
                        <TouchableOpacity
                            key={slot.name}
                            onPress={() => onTabChange(slot.name)}
                            activeOpacity={0.7}
                            style={[styles.tabStyle, { width: tabWidth }]}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: isActive }}
                            accessibilityLabel={`Navigate to ${slot.label}`}
                        >
                            <View style={styles.tabContent}>
                                <MaterialCommunityIcons
                                    name={slot.icon as any}
                                    size={isActive ? 22 : 19}
                                    color={isActive ? '#8B5CF6' : colors.textMuted}
                                />
                                <Text style={[
                                    styles.tabLabel,
                                    {
                                        color: isActive ? colors.text : colors.textMuted,
                                        fontSize: typography.fontSize.xs - 1,
                                        fontWeight: isActive ? '700' : '500',
                                        marginTop: 2,
                                    }
                                ]}>
                                    {slot.label}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Add sheet: the two ways to bring in study material */}
            <Modal visible={sheetVisible} transparent animationType="fade" onRequestClose={() => setSheetVisible(false)}>
                <Pressable style={styles.backdrop} onPress={() => setSheetVisible(false)}>
                    <Pressable
                        style={[
                            styles.sheet,
                            {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                borderRadius: borderRadius.xl,
                                marginBottom: bottom + 76,
                            },
                        ]}
                    >
                        {ACTIONS.map((action) => (
                            <TouchableOpacity
                                key={action.tab}
                                onPress={() => openAction(action.tab)}
                                style={[styles.sheetRow, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: borderRadius.lg }]}
                                accessibilityRole="button"
                            >
                                <View style={[styles.sheetIcon, { backgroundColor: `${action.color}1F` }]}>
                                    <MaterialCommunityIcons name={action.icon as any} size={24} color={action.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.sheetTitle, { color: colors.text }]}>{action.title}</Text>
                                    <Text style={[styles.sheetSub, { color: colors.textMuted }]}>{action.subtitle}</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        ))}
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    floatingBar: {
        position: 'absolute',
        alignSelf: 'center',
        flexDirection: 'row',
        height: 64,
        borderWidth: 1,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'space-around',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 8,
        zIndex: 99,
    },
    sliderBackdrop: {
        position: 'absolute',
        height: 48,
        left: 12, // matches initial padding offset
        borderWidth: 1.5,
        zIndex: 1,
    },
    tabStyle: {
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
    },
    tabContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabLabel: {
        textAlign: 'center',
    },
    actionTouch: {
        marginTop: -26, // lifts the button above the bar
        borderRadius: 30,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 10,
    },
    actionButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'transparent',
    },
    actionButtonActive: {
        borderColor: 'rgba(255,255,255,0.7)',
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
    },
    sheet: {
        borderWidth: 1,
        padding: 12,
        gap: 10,
    },
    sheetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderWidth: 1,
    },
    sheetIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sheetTitle: {
        fontSize: 15,
        fontWeight: '800',
    },
    sheetSub: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
});

export default BottomNavBar;
