import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/constants/theme';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainTabScreen from './src/screens/documents/MainTabScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Custom sub-component to consume the Theme Context and apply status bar theme styles
const AppContent = () => {
  const { theme } = useTheme();
  const { user } = useAuth();

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      {user ? <MainTabScreen /> : <AuthNavigator />}
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <AppContent />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

