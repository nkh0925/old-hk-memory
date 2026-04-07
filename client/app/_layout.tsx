import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // 新增：安全区域处理
import { useAuthStore } from 'src/stores/authStore';
import { Loading } from 'src/components/common';
import Theme from 'src/theme';

import { SettingsProvider } from 'src/contexts/SettingsContext';
import { GlobalProximityTracker } from '@/components/ai/GlobalProximityTracker';

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);
  const isLoading = useAuthStore((state) => state.isLoading);

  // 新增：获取安全区域 insets，避免 UI 紧贴顶部
  const insets = useSafeAreaInsets();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Loading />
      </View>
    );
  }

  return (
    <SettingsProvider>
      <StatusBar style="dark" />
      <GlobalProximityTracker />
      
      <View style={[styles.rootContainer, { paddingTop: insets.top + 8 }]}>
        <Slot />
      </View>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors?.background || '#FFFFFF',
  },
  rootContainer: {
    flex: 1,
    backgroundColor: Theme.colors?.background || '#FFFFFF',
  },
});