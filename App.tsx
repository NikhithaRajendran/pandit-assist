import React, { useState } from 'react';
import { ActivityIndicator, View, StatusBar, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AppProvider, useApp } from './src/context/AppContext';
import { LanguageProvider, useLanguage } from './src/i18n';
import { COLORS, DARK_COLORS } from './src/utils/constants';
import { useColors } from './src/utils/useColors';
import ErrorBoundary from './src/components/ErrorBoundary';
import Toast from './src/components/Toast';
import AnimatedSplash from './src/components/AnimatedSplash';
import HomeScreen from './src/screens/HomeScreen';
import PoojaDetailScreen from './src/screens/PoojaDetailScreen';
import ConfigScreen from './src/screens/ConfigScreen';
import PoojaItemsConfigScreen from './src/screens/PoojaItemsConfigScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LanguageSettingsScreen, {
  LanguagePickerModal,
} from './src/screens/LanguageSettingsScreen';

export type RootStackParamList = {
  Home: undefined;
  PoojaDetail: { poojaId: string; poojaName: string };
  Settings: undefined;
  Config: undefined;
  PoojaItemsConfig: { poojaId: string; poojaName: string };
  LanguageSettings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function MainNavigator() {
  const colors = useColors();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="PoojaDetail" component={PoojaDetailScreen} />
      <Stack.Screen name="Config" component={ConfigScreen} />
      <Stack.Screen name="PoojaItemsConfig" component={PoojaItemsConfigScreen} />
      <Stack.Screen
        name="LanguageSettings"
        component={LanguageSettingsScreen}
        options={{ title: 'Language' }}
      />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { loading } = useApp();
  const { t } = useLanguage();
  const colors = useColors();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary t={t}>
      <Toast />
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
    </ErrorBoundary>
  );
}

function LanguageGate({ children }: { children: React.ReactNode }) {
  const { language, initialLoading } = useLanguage();
  const colors = useColors();

  if (initialLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!language) {
    return <LanguagePickerModal onComplete={() => {}} />;
  }

  return <>{children}</>;
}

export default function App() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [splashDone, setSplashDone] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <LanguageGate>
            <AppProvider>
              <View style={{ flex: 1, position: 'relative' }}>
                <StatusBar barStyle={splashDone ? (isDark ? 'light-content' : 'dark-content') : 'light-content'} backgroundColor={isDark ? DARK_COLORS.primary : COLORS.primary} />
                <AppContent />
                {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
              </View>
            </AppProvider>
          </LanguageGate>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
