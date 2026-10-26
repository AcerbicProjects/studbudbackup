import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import HomeScreen from './HomeScreen';
import DocumentsScreen from './DocumentsScreen';
import ScannerScreen from './ScannerScreen';
import UploadScreen from './UploadScreen';
import BottomNavBar from '../../components/documents/BottomNavBar';
import DocumentDetailScreen from './DocumentDetailScreen';
import ProfileTab from './ProfileTab';
import DashboardScreen from '../dashboard/DashboardScreen';
import BreakPrompt from '../../components/study/BreakPrompt';

export const MainTabScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Home');
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    // Date Track should open on when reached from Home's goals card
    const [trackDate, setTrackDate] = useState<string | undefined>(undefined);

    const openTrack = (date: string) => {
        setTrackDate(date);
        setActiveTab('Progress');
    };

    const changeTab = (tab: string) => {
        setTrackDate(undefined);
        setActiveTab(tab);
    };

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

        switch (activeTab) {
            case 'Documents':
                return <DocumentsScreen onSelectDocument={handleSelectDocument} />;
            case 'Scan':
                return <ScannerScreen onOpenDocument={handleSelectDocument} />;
            case 'Upload':
                return <UploadScreen onOpenDocument={handleSelectDocument} />;
            case 'Progress':
                return (
                    <DashboardScreen
                        key={trackDate || 'track'}
                        initialDate={trackDate}
                        onNavigateToTab={changeTab}
                        onSelectDocument={handleSelectDocument}
                    />
                );
            case 'Profile':
                return <ProfileTab />;
            case 'Home':
            default:
                return <HomeScreen onNavigateToTab={changeTab} onSelectDocument={handleSelectDocument} onOpenTrack={openTrack} />;
        }
    };

    return (
        <View style={styles.mainContainer}>
            {/* Current Screen body */}
            {renderCurrentView()}

            {/* Floating bottom navigation (hidden on the document detail view) */}
            {selectedDocId === null && (
                <BottomNavBar currentTab={activeTab} onTabChange={changeTab} />
            )}

            {/* One break prompt for the whole app, whichever screen is open */}
            <BreakPrompt />
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
});

export default MainTabScreen;
