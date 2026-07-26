import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, FlatList, TouchableOpacity, Dimensions, ActivityIndicator, Alert, Modal, TextInput, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// Custom sub-components
import AnimatedStudyDesk from '../../components/documents/AnimatedStudyDesk';
import LampRope from '../../components/documents/LampRope';
import QuoteCard from '../../components/documents/QuoteCard';
import SearchBar from '../../components/documents/SearchBar';
import WeeklyProgressRing from '../../components/documents/WeeklyProgressRing';
import DocumentCard, { DocumentMock } from '../../components/documents/DocumentCard';

import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

const SUBJECTS = [
    { id: '1', name: 'Mathematics', icon: 'calculator' },
    { id: '2', name: 'Physics', icon: 'atom' },
    { id: '3', name: 'Chemistry', icon: 'flask' },
    { id: '5', name: 'Programming', icon: 'code-braces' },
    { id: '6', name: 'AI', icon: 'robot-outline' },
];

interface HomeScreenProps {
    onNavigateToTab: (tabName: string) => void;
    onSelectDocument: (docId: string) => void;
    globalSubject: string;
    setGlobalSubject: React.Dispatch<React.SetStateAction<string>>;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToTab, onSelectDocument, globalSubject, setGlobalSubject }) => {
    const { colors, typography, borderRadius, toggleTheme, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [searchVal, setSearchVal] = useState('');
    const [docsList, setDocsList] = useState<DocumentMock[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);
    const [customSubjects, setCustomSubjects] = useState<{ id: string; name: string; icon: string }[]>(SUBJECTS);

    useEffect(() => {
        const loadSubjects = async () => {
            try {
                const stored = await AsyncStorage.getItem('@custom_subjects');
                if (stored) {
                    setCustomSubjects(JSON.parse(stored));
                }
            } catch (err) {
                console.warn('Failed to load custom subjects');
            }
        };
        loadSubjects();
    }, []);

    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newSubjName, setNewSubjName] = useState('');

    const handleAddSubject = () => {
        setIsAddModalVisible(true);
    };

    const confirmAddSubject = async () => {
        if (!newSubjName || newSubjName.trim() === '') {
            setIsAddModalVisible(false);
            return;
        }
        const trimmed = newSubjName.trim();
        // ensure it doesn't already exist
        if (customSubjects.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
            alert("Subject already exists!");
            return;
        }
        const newSubj = { id: Date.now().toString(), name: trimmed, icon: 'book-outline' };
        const updated = [...customSubjects, newSubj];
        setCustomSubjects(updated);
        await AsyncStorage.setItem('@custom_subjects', JSON.stringify(updated));
        setGlobalSubject(trimmed);

        setNewSubjName('');
        setIsAddModalVisible(false);
    };

    const handleDeleteSubject = (subjToDelete: { id: string; name: string; icon: string }) => {
        const executeDelete = async () => {
            const updated = customSubjects.filter(s => s.id !== subjToDelete.id);
            setCustomSubjects(updated);
            await AsyncStorage.setItem('@custom_subjects', JSON.stringify(updated));
            if (globalSubject === subjToDelete.name) {
                setGlobalSubject('All');
            }
        };

        if (Platform.OS === 'web') {
            const ok = window.confirm(`Remove subject '${subjToDelete.name}'?`);
            if (ok) executeDelete();
        } else {
            Alert.alert(
                "Remove Subject",
                `Are you sure you want to delete '${subjToDelete.name}'? Documents under this subject will remain.`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Remove", style: "destructive", onPress: executeDelete }
                ]
            );
        }
    };

    useFocusEffect(
        useCallback(() => {
            const fetchDocs = async () => {
                if (!user) return;
                setIsLoadingDocs(true);
                try {
                    const response = await api.get('/api/documents');
                    const data = response.data;
                    const fetched = Array.isArray(data) ? data : (data.docs || data.documents || []);
                    const mapped: DocumentMock[] = fetched.map((doc: any) => ({
                        id: doc._id || doc.id,
                        title: doc.title,
                        subject: doc.subject,
                        pages: doc.pageCount || 0,
                        lastOpened: doc.updatedAt,
                        studyTime: '0 min',
                        progress: 0,
                        favorite: !!doc.favorite,
                        thumbnail: doc.thumbnail,
                    }));
                    setDocsList(mapped);
                } catch (err) {
                    console.error('Failed to fetch documents:', err);
                } finally {
                    setIsLoadingDocs(false);
                }
            };
            fetchDocs();
        }, [user])
    );

    // Toggle favorite helper
    const handleFavoriteToggle = async (id: string) => {
        setDocsList((prev) =>
            prev.map((doc) => (doc.id === id ? { ...doc, favorite: !doc.favorite } : doc))
        );
        try {
            const doc = docsList.find(d => d.id === id);
            if (doc) {
                await api.patch(`/api/documents/${id}`, { favorite: !doc.favorite });
            }
        } catch (err) {
            console.error('Failed to update favorite status:', err);
        }
    };

    return (
        <ScrollView
            style={[styles.mainBg, { backgroundColor: colors.background }]}
            contentContainerStyle={[styles.contentPadding, { paddingTop: Math.max(insets.top, 16), paddingBottom: 110 }]}
            showsVerticalScrollIndicator={false}
        >

            {/* Dynamic Background Ambiance Glow */}
            <View style={[
                styles.ambienceGlow,
                {
                    backgroundColor: isDark ? 'rgba(243, 140, 17, 0.05)' : 'rgba(99, 102, 241, 0.04)',
                    top: insets.top,
                }
            ]} />

            {/* --- HERO HERO HERO (Animated Study Desk + Lamp theme Toggle) --- */}
            <View style={[styles.heroBlock, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.25)' : 'rgba(255,255,255,0.45)', borderRadius: borderRadius.xl }]}>

                {/* Lamp rope pull switch */}
                <View style={styles.lampOverlay}>
                    <LampRope onPullTrigger={toggleTheme} />
                </View>

                {/* Floating elements styling desk layout */}
                <AnimatedStudyDesk />
            </View>

            {/* --- WELCOME BANNER --- */}
            <View style={styles.welcomeSection}>
                <Text style={[styles.greetText, { color: colors.textMuted, fontSize: typography.fontSize.sm + 1 }]}>
                    {isDark ? 'Good Evening,' : 'Good Morning,'}
                </Text>
                <Text style={[styles.studName, { color: colors.text, fontSize: typography.fontSize.xl + 4 }]}>
                    {user?.fullName?.split(' ')[0] || 'Student'} 👋
                </Text>
                <Text style={[styles.studSubtitle, { color: colors.textMuted, fontSize: typography.fontSize.sm }]}>
                    Ready to continue your study session?
                </Text>
            </View>

            {/* --- MOTIVATIONAL QUOTE CARD --- */}
            <QuoteCard />

            {/* --- SEARCH FILTER BAR --- */}
            <SearchBar
                value={searchVal}
                onChangeText={setSearchVal}
                onVoiceSearchPress={() => alert("Voice query activated. Speaking now...")}
            />

            {/* --- CHIPS CHIPS CHIPS (SUBJECT FILTERS) --- */}
            <View style={styles.subjHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.fontSize.md + 1 }]}>
                    Subject Tracks
                </Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollPadding}
            >
                <TouchableOpacity
                    onPress={() => setGlobalSubject('All')}
                    style={[
                        styles.chip,
                        {
                            backgroundColor: globalSubject === 'All' ? '#8B5CF6' : colors.card,
                            borderColor: colors.border,
                            borderRadius: borderRadius.md,
                        }
                    ]}
                >
                    <Text style={[styles.chipText, { color: globalSubject === 'All' ? '#FFF' : colors.text }]}>All</Text>
                </TouchableOpacity>

                {customSubjects.map((subj) => {
                    const isSelected = globalSubject === subj.name;

                    return (
                        <TouchableOpacity
                            key={subj.id}
                            onPress={() => setGlobalSubject(subj.name)}
                            onLongPress={() => handleDeleteSubject(subj)}
                            style={[
                                styles.chip,
                                {
                                    backgroundColor: isSelected ? '#8B5CF6' : colors.card,
                                    borderColor: colors.border,
                                    borderRadius: borderRadius.md,
                                }
                            ]}
                        >
                            <Text style={[styles.chipText, { color: isSelected ? '#FFF' : colors.text }]}>
                                {subj.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}

                <TouchableOpacity
                    onPress={handleAddSubject}
                    style={[
                        styles.chip,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            borderRadius: borderRadius.md,
                            borderStyle: 'dashed',
                        }
                    ]}
                >
                    <Text style={[styles.chipText, { color: colors.text }]}>+ Add</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* --- RECENT DOCUMENTS ROW --- */}
            <View style={styles.secHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.fontSize.md + 1 }]}>
                    Recent Documents
                </Text>
                <TouchableOpacity onPress={() => onNavigateToTab('Documents')}>
                    <Text style={[styles.viewAllText, { color: '#8B5CF6', fontSize: typography.fontSize.xs + 1 }]}>
                        View All
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Filtered list based on search/subj */}
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={docsList.filter(d =>
                    (globalSubject === 'All' || d.subject === globalSubject) &&
                    d.title.toLowerCase().includes(searchVal.toLowerCase())
                )}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.cardItemSpacing}>
                        <DocumentCard
                            document={item}
                            onPress={() => onSelectDocument(item.id)}
                            onFavoriteChange={handleFavoriteToggle}
                        />
                    </View>
                )}
                ListEmptyComponent={
                    <View style={[styles.emptyContent, { backgroundColor: colors.card, borderRadius: borderRadius.lg }]}>
                        <Text style={[styles.emptyText, { color: colors.textMuted, fontSize: typography.fontSize.sm }]}>
                            {isLoadingDocs ? 'Loading dynamic notes...' : 'No matching notes found. Try uploading one!'}
                        </Text>
                    </View>
                }
            />

            {/* --- WEEKLY PROGRESS WIDGET --- */}
            <View style={{ marginTop: 24 }}>
                <WeeklyProgressRing percentage={74} studyHours="16.2 hrs" />
            </View>

            {/* Custom Input Modal since Alert.prompt has spotty cross-platform support */}
            <Modal
                transparent={true}
                visible={isAddModalVisible}
                animationType="fade"
                onRequestClose={() => setIsAddModalVisible(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>New Subject</Text>
                        <Text style={[styles.modalSub, { color: colors.textMuted }]}>Enter the name of your custom subject:</Text>

                        <TextInput
                            style={[
                                styles.modalInput,
                                {
                                    backgroundColor: colors.inputBg,
                                    borderColor: colors.border,
                                    color: colors.text
                                }
                            ]}
                            value={newSubjName}
                            onChangeText={setNewSubjName}
                            placeholder="e.g. Graphic Design"
                            placeholderTextColor={colors.textMuted}
                            autoFocus
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalBtn}
                                onPress={() => setIsAddModalVisible(false)}
                            >
                                <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: '#8B5CF6', borderRadius: 8 }]}
                                onPress={confirmAddSubject}
                            >
                                <Text style={{ color: '#FFF', fontWeight: '700' }}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    mainBg: {
        flex: 1,
    },
    contentPadding: {
        paddingHorizontal: 16,
    },
    ambienceGlow: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 350,
        filter: 'blur(60px)',
    },
    heroBlock: {
        height: 230,
        justifyContent: 'flex-end',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        position: 'relative',
        marginTop: 8,
    },
    lampOverlay: {
        position: 'absolute',
        top: -30,
        right: 35,
        zIndex: 1000,
    },
    welcomeSection: {
        marginTop: 20,
        paddingHorizontal: 4,
    },
    greetText: {
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    studName: {
        fontWeight: '900',
        marginTop: 2,
        letterSpacing: -0.6,
    },
    studSubtitle: {
        fontWeight: '500',
        marginTop: 3,
    },
    sectionTitle: {
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    secHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 12,
        paddingHorizontal: 4,
    },
    subjHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    viewAllText: {
        fontWeight: '800',
    },
    horizontalScrollPadding: {
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
        elevation: 1,
    },
    chipText: {
        fontWeight: '700',
        fontSize: 13,
    },
    cardItemSpacing: {
        width: 200,
        marginRight: 14,
    },
    emptyContent: {
        width: Dimensions.get('window').width - 32,
        height: 110,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 20,
    },
    emptyText: {
        fontWeight: '600',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContainer: {
        width: '85%',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 8,
    },
    modalSub: {
        fontSize: 14,
        marginBottom: 16,
    },
    modalInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        fontSize: 14,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    modalBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default HomeScreen;
