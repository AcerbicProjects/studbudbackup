import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/constants/theme';
import AINavigator from './src/navigation/AINavigator';

// Standalone preview root for the AI Learning Module (Person 3, Week 1).
//
// This exists ONLY so the AI screens can be viewed in isolation while
// AINavigator is not yet wired into the real app (see App.tsx, which this
// file does not touch). Bundled via a separate entry point
// (index.ai-preview.ts) so App.tsx / index.ts stay untouched.
const AppContent = () => {
    const { theme } = useTheme();

    return (
        <>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
            <AINavigator />
        </>
    );
};

export default function AIPreviewApp() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <NavigationContainer>
                    <AppContent />
                </NavigationContainer>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
