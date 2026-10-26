import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Custom sub-components
import AnimatedStudyDesk, { BuddyMode } from '../../components/documents/AnimatedStudyDesk';
import TodayGoalsCard from '../../components/study/TodayGoalsCard';
import { useStudyProgress } from '../../context/StudyProgressContext';
import LampRope from '../../components/documents/LampRope';
import QuoteCard from '../../components/documents/QuoteCard';
import SearchBar from '../../components/documents/SearchBar';
import WeeklyProgressRing from '../../components/documents/WeeklyProgressRing';
import DocumentCard, { toCardData } from '../../components/documents/DocumentCard';
import SubjectChips from '../../components/documents/SubjectChips';
import { ALL_FOLDER, useDocuments, useConfirmDeleteDocument } from '../../context/DocumentsContext';
import { useAuth } from '../../context/AuthContext';

interface HomeScreenProps {
    onNavigateToTab: (tabName: string) => void;
    onSelectDocument: (docId: string) => void;
    onOpenTrack?: (date: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToTab, onSelectDocument, onOpenTrack }) => {
    const { colors, typography, borderRadius, toggleTheme, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const { timer, celebrating } = useStudyProgress();

    // The Studying Buddy mirrors the real timer state
    const buddyMode: BuddyMode = celebrating ? 'completed'
        : timer.phase === 'idle' ? 'idle'
            : timer.paused ? 'paused'
                : timer.phase === 'break' ? 'break' : 'studying';

    const [searchVal, setSearchVal] = useState('');
    const { documents, toggleFavorite, selectedFolder } = useDocuments();
    const confirmDelete = useConfirmDeleteDocument();
    const { user } = useAuth();
    const firstName = user?.fullName?.trim().split(/\s+/)[0] || 'there';

    // Most recently opened first (the API already sorts by lastOpened)
    const docsList = useMemo(() => documents.map(toCardData), [documents]);

    // Toggle favorite helper
    const handleFavoriteToggle = (id: string) => {
        toggleFavorite(id);
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

            <View style={{ marginTop: 8, marginBottom: 16 }}>
                <WeeklyProgressRing />
            </View>

            {/* Today's goals (planned in Track) + daily reminder */}
            <TodayGoalsCard onOpenTrack={(date) => (onOpenTrack ? onOpenTrack(date) : onNavigateToTab('Progress'))} />

            {/* --- HERO HERO HERO (Animated Study Desk + Lamp theme Toggle) --- */}
            <View style={[styles.heroBlock, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.25)' : 'rgba(255,255,255,0.45)', borderRadius: borderRadius.xl }]}>

                {/* Lamp rope pull switch */}
                <View style={styles.lampOverlay}>
                    <LampRope onPullTrigger={toggleTheme} />
                </View>

                {/* Floating elements styling desk layout */}
                <AnimatedStudyDesk mode={buddyMode} />
            </View>

            {/* --- WELCOME BANNER --- */}
            <View style={styles.welcomeSection}>
                <Text style={[styles.greetText, { color: colors.textMuted, fontSize: typography.fontSize.sm + 1 }]}>
                    {isDark ? 'Good Evening,' : 'Good Morning,'}
                </Text>
                <Text style={[styles.studName, { color: colors.text, fontSize: typography.fontSize.xl + 4 }]}>
                    {firstName} 👋
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

            <SubjectChips />
            <Text style={[styles.folderHint, { color: colors.textMuted, fontSize: typography.fontSize.xs }]}>
                {selectedFolder === ALL_FOLDER
                    ? 'Pick a subject to save new scans and uploads into it. Hold a subject or document to remove it.'
                    : `New scans and uploads go into ${selectedFolder}. Hold a subject or document to remove it.`}
            </Text>

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
                    (selectedFolder === ALL_FOLDER || d.subject === selectedFolder) &&
                    d.title.toLowerCase().includes(searchVal.toLowerCase())
                ).slice(0, 10)}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.cardItemSpacing}>
                        <DocumentCard
                            document={item}
                            onPress={() => onSelectDocument(item.id)}
                            onLongPress={() => confirmDelete(item.id, item.title)}
                            onMenuPress={(doc) => confirmDelete(doc.id, doc.title)}
                            onFavoriteChange={handleFavoriteToggle}
                        />
                    </View>
                )}
                ListEmptyComponent={
                    <View style={[styles.emptyContent, { backgroundColor: colors.card, borderRadius: borderRadius.lg }]}>
                        <Text style={[styles.emptyText, { color: colors.textMuted, fontSize: typography.fontSize.sm }]}>
                            {documents.length === 0
                                ? 'No documents yet. Upload a PDF or scan your notes!'
                                : 'No matching notes found.'}
                        </Text>
                    </View>
                }
            />


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
    folderHint: {
        fontWeight: '500',
        paddingHorizontal: 4,
        marginBottom: 12,
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
