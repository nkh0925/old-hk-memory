import { Redirect } from 'expo-router';
import { useAuthStore } from 'src/stores/authStore';

export default function Index() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // If authenticated, go to main app
  if (isAuthenticated) {
    return <Redirect href={'/(main)' as any} />;
  }

  // Otherwise, go to auth flow
  return <Redirect href={'/(auth)/welcome' as any} />;
}
