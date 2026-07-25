import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Custom sub-components
import AnimatedStudyDesk from '../../components/documents/AnimatedStudyDesk';
import LampRope from '../../components/documents/LampRope';
import QuoteCard from '../../components/documents/QuoteCard';
import SearchBar from '../../components/documents/SearchBar';
import WeeklyProgressRing from '../../components/documents/WeeklyProgressRing';
import DocumentCard, { DocumentMock } from '../../components/documents/DocumentCard';

// Mock data list
import { documents as mockDocs } from '../../data/documents';

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
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToTab, onSelectDocument }) => {
    const { colors, typography, borderRadius, toggleTheme, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const [searchVal, setSearchVal] = useState('');
    const [selectedSubj, setSelectedSubj] = useState('All');
    const [docsList, setDocsList] = useState<DocumentMock[]>(mockDocs);

    // Toggle favorite helper
    const handleFavoriteToggle = (id: string) => {
        setDocsList((prev) =>
            prev.map((doc) => (doc.id === id ? { ...doc, favorite: !doc.favorite } : doc))
        );
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
                    Alex 👋
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
                    onPress={() => setSelectedSubj('All')}
                    style={[
                        styles.chip,
                        {
                            backgroundColor: selectedSubj === 'All' ? '#8B5CF6' : colors.card,
                            borderColor: colors.border,
                            borderRadius: borderRadius.md,
                        }
                    ]}
                >
                    <Text style={[styles.chipText, { color: selectedSubj === 'All' ? '#FFF' : colors.text }]}>All</Text>
                </TouchableOpacity>

                {SUBJECTS.map((subj) => {
                    const isSelected = selectedSubj === subj.name;

                    return (
                        <TouchableOpacity
                            key={subj.id}
                            onPress={() => setSelectedSubj(subj.name)}
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
                    (selectedSubj === 'All' || d.subject === selectedSubj) &&
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
                            No matching notes found. Try uploading one!
                        </Text>
                    </View>
                }
            />

            {/* --- WEEKLY PROGRESS WIDGET --- */}
            <View style={{ marginTop: 24 }}>
                <WeeklyProgressRing percentage={74} studyHours="16.2 hrs" />
            </View>

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
});

export default HomeScreen;
