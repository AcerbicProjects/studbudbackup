import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HomeScreen from './HomeScreen';
import DocumentsScreen from './DocumentsScreen';
import ScannerScreen from './ScannerScreen';
import UploadScreen from './UploadScreen';
import BottomNavBar from '../../components/documents/BottomNavBar';
import FloatingUploadButton from '../../components/documents/FloatingUploadButton';
import DocumentDetailScreen from './DocumentDetailScreen';

import DashboardScreen from '../dashboard/DashboardScreen';
import AnalyticsScreen from '../dashboard/AnalyticsScreen';
import WeakTopicsScreen from '../dashboard/WeakTopicsScreen';
import StudyPlannerScreen from '../dashboard/StudyPlannerScreen';
import NotificationsScreen from '../dashboard/NotificationsScreen';

export const MainTabScreen: React.FC = () => {
    const { colors, typography, borderRadius } = useTheme();
    const insets = useSafeAreaInsets();

    const [activeTab, setActiveTab] = useState('Home');
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [activeSubScreen, setActiveSubScreen] = useState<string | null>(null);

    // Navigations helper inside tabs
    const handleSelectDocument = (docId: string) => {
        setSelectedDocId(docId);
    };

    const handleReturnFromDetail = () => {
        setSelectedDocId(null);
    };

    // Switch display panel
    const renderCurrentView = () => {
        if (selectedDocId !== null) {
            return (
                <DocumentDetailScreen
                    documentId={selectedDocId}
                    onBackPress={handleReturnFromDetail}
                />
            );
        }

        if (activeSubScreen !== null) {
            switch (activeSubScreen) {
                case 'WeakTopics':
                    return (
                        <WeakTopicsScreen
                            onBack={() => setActiveSubScreen(null)}
                            onNavigateToTab={(tab) => {
                                setActiveTab(tab);
                                setActiveSubScreen(null);
                            }}
                        />
                    );
                case 'StudyPlanner':
                    return <StudyPlannerScreen onBack={() => setActiveSubScreen(null)} />;
                case 'Notifications':
                    return <NotificationsScreen onBack={() => setActiveSubScreen(null)} />;
                case 'Analytics':
                case 'ProgressHistory':
                    return <AnalyticsScreen onBack={() => setActiveSubScreen(null)} />;
                default:
                    break;
            }
        }

        switch (activeTab) {
            case 'Home':
                return (
                    <HomeScreen
                        onNavigateToTab={setActiveTab}
                        onSelectDocument={handleSelectDocument}
                    />
                );
            case 'Documents':
                return (
                    <DocumentsScreen
                        onSelectDocument={handleSelectDocument}
                    />
                );
            case 'Scan':
                return <ScannerScreen />;
            case 'Upload':
                return <UploadScreen />;
            case 'Progress':
                return (
                    <DashboardScreen
                        onNavigateToTab={(tab) => {
                            setActiveTab(tab);
                            setActiveSubScreen(null);
                        }}
                        onNavigateToSub={setActiveSubScreen}
                        onSelectDocument={handleSelectDocument}
                    />
                );
            case 'Profile':
                return renderProfileMock();
            default:
                return <HomeScreen onNavigateToTab={setActiveTab} onSelectDocument={handleSelectDocument} />;
        }
    };

    // Mock screen views for items that don't need dedicated complicated states
    const renderProgressMock = () => (
        <ScrollView
            style={[styles.mockBg, { backgroundColor: colors.background }]}
            contentContainerStyle={[styles.mockScrollContent, { paddingTop: Math.max(insets.top, 24) }]}
        >
            <Text style={[styles.mockTitle, { color: colors.text, fontSize: typography.fontSize.xl + 2 }]}>
                Behavior Analytics
            </Text>
            <View style={[styles.mockGlassCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.xl }]}>
                <MaterialCommunityIcons name="clock-check-outline" size={44} color="#8B5CF6" />
                <Text style={[styles.mockHeadline, { color: colors.text, fontSize: typography.fontSize.md }]}>
                    14.2 Hours Studied
                </Text>
                <Text style={[styles.mockSubTitle, { color: colors.textMuted }]}>
                    You are in the top 8% of students this week! Continuous streaks lead to exponential recall gains.
                </Text>
            </View>
        </ScrollView>
    );

    const renderProfileMock = () => (
        <ScrollView
            style={[styles.mockBg, { backgroundColor: colors.background }]}
            contentContainerStyle={[styles.mockScrollContent, { paddingTop: Math.max(insets.top, 24) }]}
        >
            <Text style={[styles.mockTitle, { color: colors.text, fontSize: typography.fontSize.xl + 2 }]}>
                Student Profile
            </Text>
            <View style={[styles.mockGlassCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.xl }]}>
                <View style={[styles.avatarMock, { backgroundColor: '#8B5CF6' }]}>
                    <Text style={styles.avatarLabel}>AS</Text>
                </View>
                <Text style={[styles.mockHeadline, { color: colors.text, fontSize: typography.fontSize.md }]}>
                    Abrar Shahriar
                </Text>
                <Text style={[styles.mockSubTitle, { color: colors.textMuted }]}>
                    student@university.edu • Premium tier active
                </Text>
            </View>
        </ScrollView>
    );

    return (
        <View style={styles.mainContainer}>
            {/* Current Screen body */}
            {renderCurrentView()}

            {/* Floating Upload button (always visible except in detailed view, sub-dashboard screens or upload page) */}
            {selectedDocId === null && activeSubScreen === null && activeTab !== 'Upload' && (
                <FloatingUploadButton onPress={() => setActiveTab('Upload')} />
            )}

            {/* Floating custom bottom Navigation system */}
            {selectedDocId === null && activeSubScreen === null && (
                <BottomNavBar currentTab={activeTab} onTabChange={setActiveTab} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    mockBg: {
        flex: 1,
    },
    mockScrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 110,
    },
    mockTitle: {
        fontWeight: '900',
        letterSpacing: -0.6,
        marginBottom: 20,
    },
    mockGlassCard: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
    },
    mockHeadline: {
        fontWeight: '800',
        marginTop: 14,
        marginBottom: 6,
    },
    mockSubTitle: {
        fontWeight: '500',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
    },
    avatarMock: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarLabel: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
});

export default MainTabScreen;
