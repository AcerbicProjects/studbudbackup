import apiClient from './apiClient';
import { UserProfile } from './AuthService';

export const UserService = {
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/user/profile');
    return response.data;
  },

  async updateProfile(params: {
    fullName?: string;
    email?: string;
    university?: string;
    semester?: string;
    department?: string;
  }): Promise<{ message: string; user: UserProfile }> {
    const response = await apiClient.patch<{ message: string; user: UserProfile }>('/user/profile', params);
    return response.data;
  },

  async updateAvatar(uri: string, type: string, name: string): Promise<{ message: string; profilePhoto: string }> {
    const formData = new FormData();
    formData.append('avatar', {
      uri,
      type,
      name,
    } as any);

    const response = await apiClient.patch<{ message: string; profilePhoto: string }>('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.patch<{ message: string }>('/user/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  async deleteAccount(): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>('/user/account');
    return response.data;
  }
};

export default UserService;
