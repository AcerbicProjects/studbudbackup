import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';
import { ALL_FOLDER, useDocuments } from '../../context/DocumentsContext';
import { getErrorMessage } from '../../services/DocumentService';

interface SubjectChipsProps {
    // Show the "+" chip and allow hold-to-remove
    editable?: boolean;
}

// Subject folder chips bound to the shared selected folder.
// Tap selects, hold removes (documents move to General), "+" adds a new subject.
export const SubjectChips: React.FC<SubjectChipsProps> = ({ editable = true }) => {
    const { colors, borderRadius, typography } = useTheme();
    const { subjects, generalSubject, selectedFolder, setSelectedFolder, addSubject, removeSubject, documents } = useDocuments();

    const [addVisible, setAddVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const folders = [ALL_FOLDER, ...subjects, generalSubject];

    const handleLongPress = (name: string) => {
        if (!editable || name === ALL_FOLDER || name === generalSubject) return;
        const count = documents.filter((d) => d.subject === name).length;
        Alert.alert(
            `Remove "${name}"?`,
            count > 0
                ? `${count} document${count > 1 ? 's' : ''} in this subject will move to ${generalSubject}.`
                : 'This subject is empty.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () =>
                        removeSubject(name).catch((err) => Alert.alert('Could not remove subject', getErrorMessage(err))),
                },
            ]
        );
    };

    const handleAdd = async () => {
        const name = newName.trim();
        if (!name) return;
        setIsSaving(true);
        try {
            await addSubject(name);
            setSelectedFolder(name);
            setNewName('');
            setAddVisible(false);
        } catch (err) {
            Alert.alert('Could not add subject', getErrorMessage(err));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.row}
            >
                {folders.map((name) => {
                    const isSelected = selectedFolder === name;
                    return (
                        <TouchableOpacity
                            key={name}
                            onPress={() => setSelectedFolder(name)}
                            onLongPress={() => handleLongPress(name)}
                            delayLongPress={400}
                            style={[
                                styles.chip,
                                {
                                    backgroundColor: isSelected ? '#8B5CF6' : colors.card,
                                    borderColor: colors.border,
                                    borderRadius: borderRadius.md,
                                },
                            ]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                            accessibilityHint={
                                editable && name !== ALL_FOLDER && name !== generalSubject ? 'Hold to remove this subject' : undefined
                            }
                        >
                            <Text style={[styles.chipText, { color: isSelected ? '#FFF' : colors.text }]}>{name}</Text>
                        </TouchableOpacity>
                    );
                })}

                {editable && (
                    <TouchableOpacity
                        onPress={() => setAddVisible(true)}
                        style={[
                            styles.chip,
                            styles.addChip,
                            { borderColor: '#8B5CF6', borderRadius: borderRadius.md },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Add subject"
                    >
                        <MaterialCommunityIcons name="plus" size={16} color="#8B5CF6" />
                        <Text style={[styles.chipText, { color: '#8B5CF6' }]}>Add</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            <Modal visible={addVisible} transparent animationType="fade" onRequestClose={() => setAddVisible(false)}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.backdrop}
                >
                    <View style={[styles.dialog, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: borderRadius.xl }]}>
                        <Text style={[styles.dialogTitle, { color: colors.text, fontSize: typography.fontSize.md + 1 }]}>
                            New Subject
                        </Text>
                        <TextInput
                            value={newName}
                            onChangeText={setNewName}
                            placeholder="e.g. Data Structures"
                            placeholderTextColor={colors.textMuted}
                            maxLength={30}
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={handleAdd}
                            style={[
                                styles.input,
                                { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border, borderRadius: borderRadius.md },
                            ]}
                        />
                        <View style={styles.dialogActions}>
                            <TouchableOpacity onPress={() => setAddVisible(false)} style={styles.dialogButton}>
                                <Text style={[styles.dialogButtonText, { color: colors.textMuted }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleAdd}
                                disabled={!newName.trim() || isSaving}
                                style={[styles.dialogButton, styles.dialogPrimary, { opacity: newName.trim() ? 1 : 0.5 }]}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <Text style={[styles.dialogButtonText, { color: '#FFF' }]}>Add</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    row: {
        paddingHorizontal: 2,
        paddingBottom: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 10,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
    },
    addChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderStyle: 'dashed',
        backgroundColor: 'transparent',
    },
    chipText: {
        fontWeight: '700',
        fontSize: 13,
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    dialog: {
        width: '100%',
        maxWidth: 360,
        padding: 20,
        borderWidth: 1,
    },
    dialogTitle: {
        fontWeight: '800',
        marginBottom: 14,
    },
    input: {
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
    },
    dialogActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 18,
    },
    dialogButton: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        minWidth: 76,
        alignItems: 'center',
    },
    dialogPrimary: {
        backgroundColor: '#8B5CF6',
    },
    dialogButtonText: {
        fontWeight: '700',
        fontSize: 14,
    },
});

export default SubjectChips;
