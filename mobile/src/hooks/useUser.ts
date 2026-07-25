import { useAuth } from '../context/AuthContext';

export const useUser = () => {
  const { user, isLoading, setUser, logout } = useAuth();
  
  return {
    user,
    isLoading,
    setUser,
    logout,
  };
};
