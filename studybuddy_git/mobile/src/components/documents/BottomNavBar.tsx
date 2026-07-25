import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavBarProps {
    currentTab: string;
    onTabChange: (tab: string) => void;
}

const { width } = Dimensions.get('window');
const TABS = [
    { name: 'Home', icon: 'home-variant', label: 'Home' },
    { name: 'Documents', icon: 'file-document', label: 'Docs' },
    { name: 'Scan', icon: 'camera', label: 'Scan' },
    { name: 'Progress', icon: 'trending-up', label: 'Track' },
    { name: 'Profile', icon: 'account', label: 'Profile' },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentTab, onTabChange }) => {
    const { colors, borderRadius, typography } = useTheme();
    const insets = useSafeAreaInsets();

    // Width calculation per tab
    const barPadding = 12;
    const navBarWidth = width - 32; // fits screen with horizontal margin
    const tabWidth = (navBarWidth - (barPadding * 2)) / TABS.length;

    // Track the index of the selected tab
    const selectedIndex = TABS.findIndex((t) => t.name === currentTab);

    // Position transition of active background highlight
    const sliderPosition = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(sliderPosition, {
            toValue: selectedIndex * tabWidth,
            friction: 6,
            tension: 30,
            useNativeDriver: true,
        }).start();
    }, [selectedIndex, tabWidth]);

    return (
        <View style={[
            styles.floatingBar,
            {
                backgroundColor: colors.card,
                borderColor: colors.border,
                bottom: Math.max(insets.bottom, 12),
                width: navBarWidth,
                borderRadius: borderRadius.round,
            }
        ]}>
            {/* Sliding Glass pill element behind the active icon */}
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

            {/* Tabs list representation */}
            {TABS.map((tab) => {
                const isActive = tab.name === currentTab;

                return (
                    <TouchableOpacity
                        key={tab.name}
                        onPress={() => onTabChange(tab.name)}
                        activeOpacity={0.7}
                        style={[styles.tabStyle, { width: tabWidth }]}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isActive }}
                        accessibilityLabel={`Navigate to ${tab.name}`}
                    >
                        <View style={styles.tabContent}>
                            <MaterialCommunityIcons
                                name={tab.icon as any}
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
                                {tab.label}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
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
});

export default BottomNavBar;
