import { useCallback } from 'react';
import { useUserStore } from '@/store/userStore';
import { AuthService } from '@/api/authService';
import { AuthResponse } from '@/types';

/**
 * Custom hook that wraps authService and the Zustand userStore,
 * providing clean login/logout helpers to any component.
 */
export function useAuth() {
  const {
    user,
    doctorProfile,
    role,
    isAuthenticated,
    isDoctorMode,
    isCaregiverMode,
    login,
    logout: storeLogout,
  } = useUserStore();

  /**
   * Call after a successful API login response.
   * Updates the Zustand store with the session data.
   * Note: Session is already persisted to localStorage inside authService.login/signup.
   */
  const handleLoginSuccess = useCallback((session: AuthResponse) => {
    login(session.user, session.role, session.token);
  }, [login]);

  /**
   * Clears both the persisted session and the Zustand store.
   */
  const logout = useCallback(() => {
    AuthService.logout();
    storeLogout();
  }, [storeLogout]);

  /**
   * Re-hydrate state from the stored session (used on app mount).
   */
  const restoreSession = useCallback((): AuthResponse | null => {
    const session = AuthService.getSession();
    if (session) {
      login(session.user, session.role, session.token);
    }
    return session;
  }, [login]);

  return {
    user,
    doctorProfile,
    role,
    isAuthenticated,
    isDoctorMode,
    isCaregiverMode,
    handleLoginSuccess,
    logout,
    restoreSession,
  };
}
