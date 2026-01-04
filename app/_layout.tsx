// app/_layout.tsx

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Auth } from '@/components/auth/auth';
import { Spinner } from '@/components/ui/spinner';
import { View } from '@/components/ui/view';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/theme/colors';
import { ThemeProvider } from '@/theme/theme-provider';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import {
  Authenticated,
  AuthLoading,
  ConvexReactClient,
  Unauthenticated,
} from 'convex/react';
import { osName } from 'expo-device';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { setBackgroundColorAsync } from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as NavigationBar from 'expo-navigation-bar';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { KeyboardProvider } from 'react-native-keyboard-controller';

SplashScreen.setOptions({
  duration: 200,
  fade: true,
});

const secureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  const colorScheme = useColorScheme() || 'light';

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setButtonStyleAsync(
        colorScheme === 'light' ? 'dark' : 'light'
      );
    }
  }, [colorScheme]);

  // Keep the root view background color in sync with the current theme
  useEffect(() => {
    setBackgroundColorAsync(
      colorScheme === 'dark' ? Colors.dark.background : Colors.light.background
    );
  }, [colorScheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <KeyboardProvider>
          <StatusBar style={'dark'} animated />

          <ConvexAuthProvider
            client={convex}
            storage={
              Platform.OS === 'android' || Platform.OS === 'ios'
                ? secureStorage
                : undefined
            }
          >
            <AuthLoading>
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: Colors.dark.orca,
                }}
              >
                <Spinner size='lg' variant='circle' color='#000000' />
              </View>
            </AuthLoading>
            <Unauthenticated>
              <Auth />
            </Unauthenticated>
            <Authenticated>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name='(home)' options={{ headerShown: false }} />
                <Stack.Screen name='orca/[id]' />

                <Stack.Screen
                  name='(modal)/courses'
                  options={{
                    headerShown: false,
                    sheetGrabberVisible: true,
                    sheetAllowedDetents: [0.4, 0.7, 1],
                    contentStyle: {
                      backgroundColor:
                        isLiquidGlassAvailable() && osName !== 'iPadOS'
                          ? 'transparent'
                          : colorScheme === 'dark'
                            ? Colors.dark.card
                            : Colors.light.card,
                    },
                    headerTransparent: Platform.OS === 'ios' ? true : false,
                    headerLargeTitle: false,
                    title: '',
                    presentation:
                      Platform.OS === 'ios'
                        ? isLiquidGlassAvailable() && osName !== 'iPadOS'
                          ? 'formSheet'
                          : 'modal'
                        : 'modal',
                    sheetInitialDetentIndex: 0,
                    headerStyle: {
                      backgroundColor:
                        Platform.OS === 'ios'
                          ? 'transparent'
                          : colorScheme === 'dark'
                            ? Colors.dark.card
                            : Colors.light.card,
                    },
                    headerBlurEffect:
                      isLiquidGlassAvailable() && osName !== 'iPadOS'
                        ? undefined
                        : colorScheme === 'dark'
                          ? 'dark'
                          : 'light',

                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen
                  name='(modal)/settings'
                  options={{
                    headerShown: false,
                    sheetGrabberVisible: true,
                    sheetAllowedDetents: [1],
                    contentStyle: {
                      backgroundColor:
                        isLiquidGlassAvailable() && osName !== 'iPadOS'
                          ? 'transparent'
                          : colorScheme === 'dark'
                            ? Colors.dark.card
                            : Colors.light.card,
                    },
                    headerTransparent: Platform.OS === 'ios' ? true : false,
                    headerLargeTitle: false,
                    title: '',
                    presentation:
                      Platform.OS === 'ios'
                        ? isLiquidGlassAvailable() && osName !== 'iPadOS'
                          ? 'formSheet'
                          : 'modal'
                        : 'modal',
                    sheetInitialDetentIndex: 0,
                    headerStyle: {
                      backgroundColor:
                        Platform.OS === 'ios'
                          ? 'transparent'
                          : colorScheme === 'dark'
                            ? Colors.dark.card
                            : Colors.light.card,
                    },
                    headerBlurEffect:
                      isLiquidGlassAvailable() && osName !== 'iPadOS'
                        ? undefined
                        : colorScheme === 'dark'
                          ? 'dark'
                          : 'light',

                    animation: 'slide_from_bottom',
                  }}
                />

                <Stack.Screen name='+not-found' />
              </Stack>
            </Authenticated>
          </ConvexAuthProvider>
        </KeyboardProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
