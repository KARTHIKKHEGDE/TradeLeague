import { useUserStore } from '../stores/userStore';

export const useAuth = () => {
  const { user, isAuthenticated, setUser, setToken, logout } = useUserStore();

  return {
    user,
    isAuthenticated,
    setUser,
    setToken,
    logout,
  };
};