import apiClient from './apiClient';

export interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  university: string;
  studentId: string;
  semester?: string;
  department?: string;
  profilePhoto?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export const AuthService = {
  async register(params: {
    fullName: string;
    email: string;
    password?: string;
    university: string;
    studentId: string;
  }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', params);
    return response.data;
  },

  async login(params: {
    email: string;
    password?: string;
  }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', params);
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/verify-email', { token });
    return response.data;
  },

  async getMe(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/auth/me');
    return response.data;
  },

  async googleLogin(params: {
    email: string;
    fullName: string;
    googleId: string;
    profilePhoto?: string;
  }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/google-login', params);
    return response.data;
  },
};

export default AuthService;
