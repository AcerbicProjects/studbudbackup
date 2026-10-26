import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import SearchBar from '../../components/documents/SearchBar';
import SubjectChips from '../../components/documents/SubjectChips';
import DocumentCard, { DocumentCardData, toCardData } from '../../components/documents/DocumentCard';
import { ALL_FOLDER, useDocuments, useConfirmDeleteDocument } from '../../context/DocumentsContext';

const { width } = Dimensions.get('window');

interface DocumentsScreenProps {
    onSelectDocument: (docId: string) => void;
}

export const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ onSelectDocument }) => {
    const { colors, typography, borderRadius } = useTheme();
    const insets = useSafeAreaInsets();
    const { documents, isLoading, error, refresh, toggleFavorite, selectedFolder: activeCategory } = useDocuments();
    const confirmDelete = useConfirmDeleteDocument();

    const [searchQuery, setSearchQuery] = useState('');
    const [isGridView, setIsGridView] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const documentsState = useMemo(() => documents.map(toCardData), [documents]);

    const handleFavoriteToggle = (id: string) => {
        toggleFavorite(id);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refresh();
        setIsRefreshing(false);
    };

    const handleMenuPress = (doc: DocumentCardData) => {
        confirmDelete(doc.id, doc.title);
    };

    const getSubjectColor = (subj: string) => {
        switch (subj.toLowerCase()) {
            case 'mathematics': return '#F59E0B';
            case 'physics': return '#EF4444';
            case 'chemistry': return '#10B981';
            case 'programming': return '#3B82F6';
            case 'ai': return '#8B5CF6';
            default: return '#6366F1';
        }
    };

    const filteredCollection = documentsState.filter((doc) => {
        const matchesCategory = activeCategory === ALL_FOLDER || doc.subject === activeCategory;
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <View style={[styles.mainBg, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>

            {/* Search Query header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text, fontSize: typography.fontSize.xl + 2 }]}>
                    Document Hub
                </Text>

                <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

                {/* Sub-header row for Category Filters / Layout controls */}
                <View style={styles.subControlsBar}>
                    <Text style={[styles.resultsLabel, { color: colors.textMuted, fontSize: typography.fontSize.xs + 1 }]}>
                        {filteredCollection.length} Documents Available
                    </Text>

                    <TouchableOpacity
                        onPress={() => setIsGridView(!isGridView)}
                        style={[styles.gridToggleBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                        accessibilityRole="button"
                        accessibilityLabel="Switch layout"
                    >
                        <MaterialCommunityIcons
                            name={isGridView ? "format-list-bulleted" : "view-grid-outline"}
                            size={18}
                            color={colors.text}
                        />
                    </TouchableOpacity>
                </View>

                {/* Subject folders (shared with Home; hold to remove, + to add) */}
                <SubjectChips />
            </View>

            {/* Grid vs List FlatList rendering */}
            <FlatList
                key={isGridView ? 'g' : 'l'} // forces full layout re-render when changing views
                numColumns={isGridView ? 2 : 1}
                data={filteredCollection}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    if (isGridView) {
                        // Render smaller variant for grid layout
                        const subjColor = getSubjectColor(item.subject);
                        return (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => onSelectDocument(item.id)}
                                onLongPress={() => confirmDelete(item.id, item.title)}
                                delayLongPress={400}
                                style={[
                                    styles.gridItem,
                                    {
                                        backgroundColor: colors.card,
                                        borderColor: colors.border,
                                        borderRadius: borderRadius.lg,
                                    }
                                ]}
                            >
                                <View style={[styles.gridThumb, { backgroundColor: colors.inputBg }]}>
                                    <MaterialCommunityIcons name={item.icon as any} size={32} color={subjColor} />
                                </View>
                                <Text numberOfLines={1} style={[styles.gridTitle, { color: colors.text, fontSize: typography.fontSize.xs + 1 }]}>
                                    {item.title}
                                </Text>
                                <Text style={[styles.gridMeta, { color: colors.textMuted, fontSize: 10 }]}>
                                    {item.subject} • {item.pages} pgs
                                </Text>
                            </TouchableOpacity>
                        );
                    }

                    // Render large card for List View
                    return (
                        <DocumentCard
                            document={item}
                            onPress={() => onSelectDocument(item.id)}
                            onFavoriteChange={handleFavoriteToggle}
                            onLongPress={() => confirmDelete(item.id, item.title)}
                            onMenuPress={handleMenuPress}
                        />
                    );
                }}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#8B5CF6" colors={['#8B5CF6']} />
                }
                ListEmptyComponent={
                    isLoading ? (
                        <View style={styles.emptyView}>
                            <ActivityIndicator size="large" color="#8B5CF6" />
                        </View>
                    ) : (
                        <View style={styles.emptyView}>
                            <MaterialCommunityIcons
                                name={error ? 'cloud-alert' : 'file-search-outline'}
                                size={44}
                                color={colors.textMuted}
                            />
                            <Text style={[styles.emptyHeader, { color: colors.text }]}>
                                {error ? 'Could Not Load Documents' : 'No Documents Found'}
                            </Text>
                            <Text style={[styles.emptySubText, { color: colors.textMuted }]}>
                                {error
                                    ? `${error} Pull down to try again.`
                                    : documents.length === 0
                                        ? 'Upload a PDF or scan your notes to populate this shelf.'
                                        : 'No documents match this search or subject.'}
                            </Text>
                        </View>
                    )
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    mainBg: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    title: {
        fontWeight: '900',
        letterSpacing: -0.6,
    },
    subControlsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        marginBottom: 10,
    },
    resultsLabel: {
        fontWeight: '600',
    },
    gridToggleBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tagsScroll: {
        marginBottom: 8,
    },
    filterTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        borderWidth: 1,
    },
    tagLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingBottom: 120, // allows clearing floating nav
    },
    gridItem: {
        width: (width - 44) / 2,
        margin: 5,
        borderWidth: 1,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 2,
    },
    gridThumb: {
        height: 75,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    gridTitle: {
        fontWeight: '700',
    },
    gridMeta: {
        fontWeight: '500',
        marginTop: 1,
    },
    emptyView: {
        alignItems: 'center',
        marginTop: 48,
        paddingHorizontal: 28,
    },
    emptyHeader: {
        fontWeight: '800',
        marginTop: 12,
        fontSize: 16,
    },
    emptySubText: {
        fontWeight: '500',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 4,
    },
});

export default DocumentsScreen;
