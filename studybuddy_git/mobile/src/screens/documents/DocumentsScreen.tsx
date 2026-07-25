import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import SearchBar from '../../components/documents/SearchBar';
import DocumentCard, { DocumentMock } from '../../components/documents/DocumentCard';
import { documents as mockDocs } from '../../data/documents';

const { width } = Dimensions.get('window');

const SUBJECT_CATEGORIES = [
    'All',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Programming',
    'AI',
];

interface DocumentsScreenProps {
    onSelectDocument: (docId: string) => void;
}

export const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ onSelectDocument }) => {
    const { colors, typography, borderRadius } = useTheme();
    const insets = useSafeAreaInsets();

    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isGridView, setIsGridView] = useState(false);
    const [documentsState, setDocumentsState] = useState<DocumentMock[]>(mockDocs);

    const handleFavoriteToggle = (id: string) => {
        setDocumentsState((prev) =>
            prev.map((doc) => (doc.id === id ? { ...doc, favorite: !doc.favorite } : doc))
        );
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
        const matchesCategory = activeCategory === 'All' || doc.subject === activeCategory;
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

                {/* Horizontal filters tags scroll */}
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={SUBJECT_CATEGORIES}
                    keyExtractor={(item) => item}
                    style={styles.tagsScroll}
                    renderItem={({ item }) => {
                        const isSelected = activeCategory === item;
                        return (
                            <TouchableOpacity
                                onPress={() => setActiveCategory(item)}
                                style={[
                                    styles.filterTag,
                                    {
                                        backgroundColor: isSelected ? '#8B5CF6' : colors.card,
                                        borderColor: colors.border,
                                        borderRadius: borderRadius.sm,
                                    }
                                ]}
                            >
                                <Text style={[styles.tagLabel, { color: isSelected ? '#FFF' : colors.text }]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
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
                                    <MaterialCommunityIcons name="file-pdf-box" size={32} color={subjColor} />
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
                        />
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyView}>
                        <MaterialCommunityIcons name="file-search-outline" size={44} color={colors.textMuted} />
                        <Text style={[styles.emptyHeader, { color: colors.text }]}>No Documents Found</Text>
                        <Text style={[styles.emptySubText, { color: colors.textMuted }]}>
                            Try uploading new syllabus materials to populate this shelf.
                        </Text>
                    </View>
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
