import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../../hooks/useUser';
import { useProfile } from '../../hooks/useProfile';
import AuthInput from '../../components/auth/AuthInput';
import PasswordInput from '../../components/auth/PasswordInput';
import LoadingButton from '../../components/auth/LoadingButton';
import ErrorSnackbar from '../../components/auth/ErrorSnackbar';

export const ProfileTab: React.FC = () => {
    const { colors, typography, borderRadius } = useTheme();
    const insets = useSafeAreaInsets();
    const { user, logout } = useUser();
    const { updateProfile, updateAvatar, changePassword, pickImage, isUpdating, error: profileError } = useProfile();

    // Form states
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [university, setUniversity] = useState(user?.university || '');
    const [semester, setSemester] = useState(user?.semester || '');
    const [department, setDepartment] = useState(user?.department || '');

    // Password states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Snackbar state
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarType, setSnackbarType] = useState<'error' | 'success'>('error');

    useEffect(() => {
        if (profileError) {
            setSnackbarType('error');
            setSnackbarMessage(profileError);
            setSnackbarVisible(true);
        }
    }, [profileError]);

    const handleUpdateProfile = async () => {
        if (!fullName || !university) {
            setSnackbarType('error');
            setSnackbarMessage('Name and University are required');
            setSnackbarVisible(true);
            return;
        }

        const res = await updateProfile({ fullName, university, semester, department });
        if (res.success) {
            setSnackbarType('success');
            setSnackbarMessage(res.message);
            setSnackbarVisible(true);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            setSnackbarType('error');
            setSnackbarMessage('Both password fields are required');
            setSnackbarVisible(true);
            return;
        }
        if (newPassword.length < 6) {
            setSnackbarType('error');
            setSnackbarMessage('New password must be at least 6 characters');
            setSnackbarVisible(true);
            return;
        }

        const res = await changePassword(currentPassword, newPassword);
        if (res.success) {
            setSnackbarType('success');
            setSnackbarMessage(res.message);
            setSnackbarVisible(true);
            setCurrentPassword('');
            setNewPassword('');
        }
    };

    const handleImagePick = () => {
        Alert.alert(
            'Change Profile Photo',
            'Choose an option',
            [
                { text: 'Camera', onPress: () => handlePick(true) },
                { text: 'Gallery', onPress: () => handlePick(false) },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const handlePick = async (useCamera: boolean) => {
        const res = await pickImage(useCamera);
        if (!res.success && res.message !== 'Cancelled') {
            setSnackbarType('error');
            setSnackbarMessage(res.message);
            setSnackbarVisible(true);
        } else if (res.success) {
            setSnackbarType('success');
            setSnackbarMessage(res.message);
            setSnackbarVisible(true);
        }
    };

    const initials = user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <ScrollView
                style={[styles.mockBg, { backgroundColor: colors.background }]}
                contentContainerStyle={[styles.mockScrollContent, { paddingTop: Math.max(insets.top, 24) }]}
            >
                <Text style={[styles.mockTitle, { color: colors.text, fontSize: typography.fontSize.xl + 2 }]}>
                    Student Profile
                </Text>
                
                <View style={[styles.mockGlassCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.xl }]}>
                    
                    <TouchableOpacity onPress={handleImagePick} style={styles.avatarContainer}>
                        {user?.profilePhoto ? (
                            <Image source={{ uri: user.profilePhoto }} style={styles.profileAvatarImage} />
                        ) : (
                            <View style={[styles.avatarMock, { backgroundColor: '#8B5CF6' }]}>
                                <Text style={styles.avatarLabel}>{initials}</Text>
                            </View>
                        )}
                        <View style={styles.editIconContainer}>
                            <MaterialCommunityIcons name="camera" size={16} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                    
                    <Text style={[styles.mockHeadline, { color: colors.text, fontSize: typography.fontSize.md }]}>
                        {user?.email}
                    </Text>

                    <View style={styles.formContainer}>
                        <AuthInput
                            label="Full Name"
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="John Doe"
                            iconName="account-outline"
                        />
                        <AuthInput
                            label="University"
                            value={university}
                            onChangeText={setUniversity}
                            placeholder="Harvard University"
                            iconName="school-outline"
                        />
                        <AuthInput
                            label="Department"
                            value={department}
                            onChangeText={setDepartment}
                            placeholder="Computer Science"
                            iconName="book-education-outline"
                        />
                        <AuthInput
                            label="Semester"
                            value={semester}
                            onChangeText={setSemester}
                            placeholder="Fall 2024"
                            iconName="calendar-clock-outline"
                        />
                        
                        <LoadingButton
                            title="Update Profile"
                            onPress={handleUpdateProfile}
                            isLoading={isUpdating}
                            style={{ marginTop: 8, marginBottom: 24 }}
                        />

                        <View style={styles.divider} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Change Password</Text>
                        
                        <PasswordInput
                            label="Current Password"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder="••••••••"
                        />
                        <PasswordInput
                            label="New Password"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="••••••••"
                        />
                        
                        <LoadingButton
                            title="Change Password"
                            onPress={handleChangePassword}
                            isLoading={isUpdating}
                            style={{ marginTop: 8, backgroundColor: '#8B5CF6' }}
                        />
                    </View>

                    <TouchableOpacity 
                        style={[styles.logoutButton, { backgroundColor: colors.error || '#EF4444' }]} 
                        onPress={logout}
                    >
                        <Text style={styles.logoutButtonText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <ErrorSnackbar
                visible={snackbarVisible}
                message={snackbarMessage}
                type={snackbarType}
                onDismiss={() => setSnackbarVisible(false)}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    mockBg: {
        flex: 1,
    },
    mockScrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 110,
    },
    mockTitle: {
        fontWeight: '900',
        letterSpacing: -0.6,
        marginBottom: 20,
    },
    mockGlassCard: {
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    profileAvatarImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    avatarMock: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarLabel: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '800',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4F46E5',
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    mockHeadline: {
        fontWeight: '600',
        marginBottom: 24,
    },
    formContainer: {
        width: '100%',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        width: '100%',
        marginVertical: 24,
    },
    sectionTitle: {
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 16,
    },
    logoutButton: {
        marginTop: 32,
        width: '100%',
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ProfileTab;
