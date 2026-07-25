import React, { createContext, useContext, useState, useEffect } from 'react';
import TokenManager from '../services/TokenManager';
import AuthService, { UserProfile } from '../services/AuthService';
import { registerSessionExpiredCallback } from '../services/apiClient';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (params: {
    fullName: string;
    email: string;
    password?: string;
    university: string;
    studentId: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkLogin: () => Promise<boolean>;
  setUser: (user: UserProfile | null) => void;
  googleLogin: (params: {
    email: string;
    fullName: string;
    googleId: string;
    profilePhoto?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkLogin = async (): Promise<boolean> => {
    const startTime = Date.now();
    try {
      const accessToken = await TokenManager.getAccessToken();
      const refreshToken = await TokenManager.getRefreshToken();

      if (!accessToken || !refreshToken) {
        setUser(null);
        return false;
      }

      // Load user profile
      const profile = await AuthService.getMe();
      
      // Delay to allow SplashScreen animation to complete gracefully (3.2 seconds)
      const elapsed = Date.now() - startTime;
      const remainingDelay = 3200 - elapsed;
      if (remainingDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingDelay));
      }

      setUser(profile);
      return true;
    } catch (error) {
      console.log('[AUTH] Startup check failed, clear tokens:', error);
      await TokenManager.clearTokens();
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Register callback for when refresh token expires
    registerSessionExpiredCallback(() => {
      setUser(null);
    });

    // Check login state on mount
    checkLogin();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await AuthService.login({ email, password });
    await TokenManager.saveTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  };

  const register = async (params: {
    fullName: string;
    email: string;
    password?: string;
    university: string;
    studentId: string;
  }) => {
    const data = await AuthService.register(params);
    await TokenManager.saveTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (e) {
      // Ignore API errors on logout
    } finally {
      await TokenManager.clearTokens();
      setUser(null);
    }
  };

  const googleLogin = async (params: {
    email: string;
    fullName: string;
    googleId: string;
    profilePhoto?: string;
  }) => {
    const data = await AuthService.googleLogin(params);
    await TokenManager.saveTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        checkLogin,
        setUser,
        googleLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
