import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { AuthInput, AuthInputProps } from './AuthInput';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';

export const PasswordInput: React.FC<AuthInputProps> = (props) => {
  const { colors } = useTheme();
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const toggleSecureEntry = () => {
    setSecureTextEntry((prev) => !prev);
  };

  const renderEyeIcon = () => (
    <TouchableOpacity
      onPress={toggleSecureEntry}
      style={styles.eyeButton}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={secureTextEntry ? "Show password" : "Hide password"}
    >
      <MaterialCommunityIcons
        name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
        size={20}
        color={colors.textMuted}
      />
    </TouchableOpacity>
  );

  return (
    <AuthInput
      {...props}
      secureTextEntry={secureTextEntry}
      iconName={props.iconName || "lock-outline"}
      rightAccessory={renderEyeIcon()}
    />
  );
};

const styles = StyleSheet.create({
  eyeButton: {
    paddingHorizontal: 8,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default PasswordInput;
