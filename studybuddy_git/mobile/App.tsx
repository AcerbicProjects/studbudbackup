import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/constants/theme';
import AuthNavigator from './src/navigation/AuthNavigator';

// Custom sub-component to consume the Theme Context and apply status bar theme styles
const AppContent = () => {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <AuthNavigator />
    </>
  );
};

export default function App() {
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
