import { Stack } from 'expo-router';

/**
 * Authentication group layout
 * Contains login, register, and other auth-related screens
 */
export default function AuthLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
