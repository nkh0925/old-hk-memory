import { Redirect } from 'expo-router';

/**
 * Root index - redirects to appropriate screen based on auth state
 * For now, redirects to main tab navigator
 */
export default function Index(): JSX.Element {
  // TODO: Check authentication state and redirect accordingly
  // const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  // if (!isAuthenticated) {
  //   return <Redirect href="/(auth)/login" />;
  // }

  return <Redirect href="/(main)" />;
}
