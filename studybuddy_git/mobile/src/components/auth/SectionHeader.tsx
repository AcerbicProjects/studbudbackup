import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../constants/theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: any;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onActionPress,
  style,
}) => {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, { color: colors.text, fontSize: typography.fontSize.lg }]}>
        {title}
      </Text>
      
      {actionLabel && onActionPress ? (
        <TouchableOpacity onPress={onActionPress} activeOpacity={0.7}>
          <Text style={[styles.actionText, { color: colors.primary, fontSize: typography.fontSize.sm }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    marginBottom: 12,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  actionText: {
    fontWeight: '700',
  },
});
export default SectionHeader;
