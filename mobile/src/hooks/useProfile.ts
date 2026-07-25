import { useState } from 'react';
import { useUser } from './useUser';
import UserService from '../services/UserService';
import * as ImagePicker from 'expo-image-picker';

export const useProfile = () => {
  const { user, setUser } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (data: { fullName?: string; email?: string; university?: string; semester?: string; department?: string }) => {
    setIsUpdating(true);
    setError(null);
    try {
      const result = await UserService.updateProfile(data);
      setUser(result.user);
      return { success: true, message: result.message };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsUpdating(false);
    }
  };

  const updateAvatar = async (uri: string, type: string, name: string) => {
    setIsUpdating(true);
    setError(null);
    
    // Optimistic UI update
    const previousPhoto = user?.profilePhoto;
    if (user) {
      setUser({ ...user, profilePhoto: uri });
    }

    try {
      const result = await UserService.updateAvatar(uri, type, name);
      if (user) {
         setUser({ ...user, profilePhoto: result.profilePhoto });
      }
      return { success: true, message: result.message };
    } catch (err: any) {
      // Revert optimistic update on failure
      if (user) {
         setUser({ ...user, profilePhoto: previousPhoto });
      }
      const msg = err.response?.data?.message || err.message || 'Failed to update avatar';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsUpdating(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setIsUpdating(true);
    setError(null);
    try {
      const result = await UserService.changePassword(currentPassword, newPassword);
      return { success: true, message: result.message };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to change password';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsUpdating(false);
    }
  };
  
  const pickImage = async (useCamera: boolean = false) => {
    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7, // compression
    };

    if (useCamera) {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        return { success: false, message: "Permission to access camera is required!" };
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        return { success: false, message: "Permission to access gallery is required!" };
      }
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const uriParts = asset.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      const name = asset.fileName || `photo.${fileType}`;
      const type = `image/${fileType === 'jpg' ? 'jpeg' : fileType}`;
      
      return updateAvatar(asset.uri, type, name);
    }
    return { success: false, message: 'Cancelled' };
  };

  return {
    isUpdating,
    error,
    updateProfile,
    updateAvatar,
    changePassword,
    pickImage
  };
};
