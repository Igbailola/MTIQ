import { useAuth as useAuthContext } from '@/components/providers/auth-provider';

/**
 * Custom hook to consume the AuthContext.
 * Provides user, session, profile, loading states, and auth methods.
 */
export function useAuth() {
  return useAuthContext();
}
