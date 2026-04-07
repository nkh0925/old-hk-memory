import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from 'src/stores/authStore';
import { useSettings } from 'src/contexts/SettingsContext';
import { AiModeModal } from 'src/components/common/AiModeModal';
import theme from 'src/theme';

export default function MainLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { setModalVisible, isAiModeEnabled } = useSettings();

  if (!isAuthenticated) {
    return <Redirect href={'/(auth)/welcome' as any} />;
  }

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.gray500,
          headerShown: false,
          tabBarStyle: {
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            backgroundColor: theme.colors.background,
            paddingBottom: theme.spacing.xs,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.medium,
            fontFamily: theme.fonts.body,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Map',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="upload"
          options={{
            title: 'Upload',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="camera-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="ai-settings-trigger"
          listeners={{
            tabPress: (e) => {
              e.preventDefault(); 
              setModalVisible(true); 
            },
          }}
          options={{
            title: 'AI Mode',
            tabBarIcon: ({ color, size }) => (
              <Ionicons 
                name={isAiModeEnabled ? "sparkles" : "sparkles-outline"} 
                size={size} 
                color={isAiModeEnabled ? theme.colors.primary : color} 
              />
            ),
          }}
        />
      </Tabs>
      <AiModeModal />
    </>
  );
}