import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import DocumentService, {
  DocumentSource,
  StudyDocument,
  UploadFile,
  getErrorMessage,
} from '../services/DocumentService';

// "All" is a view, not a folder: uploads made while it is selected are auto-sorted by the AI
export const ALL_FOLDER = 'All';

interface DocumentsContextType {
  documents: StudyDocument[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  uploadDocument: (
    file: UploadFile,
    options?: { source?: DocumentSource; title?: string; subject?: string; pageImages?: UploadFile[] },
    onProgress?: (percent: number) => void
  ) => Promise<StudyDocument>;
  toggleFavorite: (id: string) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
  replaceDocument: (doc: StudyDocument) => void;

  // Subject folders
  subjects: string[];
  generalSubject: string;
  selectedFolder: string;
  setSelectedFolder: (folder: string) => void;
  addSubject: (name: string) => Promise<void>;
  removeSubject: (name: string) => Promise<void>;
}

const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);

// Single source of truth for the signed-in user's documents and folders, shared by every tab
export const DocumentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [generalSubject, setGeneralSubject] = useState('General');
  const [selectedFolder, setSelectedFolder] = useState(ALL_FOLDER);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [docs, folderInfo] = await Promise.all([DocumentService.list(), DocumentService.getSubjects()]);
      setDocuments(docs);
      setSubjects(folderInfo.subjects);
      setGeneralSubject(folderInfo.general);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your documents.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const uploadDocument = useCallback<DocumentsContextType['uploadDocument']>(async (file, options, onProgress) => {
    const doc = await DocumentService.upload(file, options, onProgress);
    setDocuments((prev) => [doc, ...prev.filter((d) => d._id !== doc._id)]);
    return doc;
  }, []);

  const replaceDocument = useCallback((doc: StudyDocument) => {
    setDocuments((prev) => prev.map((d) => (d._id === doc._id ? doc : d)));
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    let next = false;
    // Optimistic update, rolled back if the request fails
    setDocuments((prev) => prev.map((d) => {
      if (d._id !== id) return d;
      next = !d.favorite;
      return { ...d, favorite: next };
    }));
    try {
      await DocumentService.update(id, { favorite: next });
    } catch {
      setDocuments((prev) => prev.map((d) => (d._id === id ? { ...d, favorite: !next } : d)));
    }
  }, []);

  const removeDocument = useCallback(async (id: string) => {
    await DocumentService.remove(id);
    setDocuments((prev) => prev.filter((d) => d._id !== id));
  }, []);

  const addSubject = useCallback(async (name: string) => {
    const result = await DocumentService.addSubject(name);
    setSubjects(result.subjects);
  }, []);

  const removeSubject = useCallback(async (name: string) => {
    const result = await DocumentService.removeSubject(name);
    setSubjects(result.subjects);
    // Its documents now live in General
    setDocuments((prev) => prev.map((d) => (d.subject === name ? { ...d, subject: result.general } : d)));
    setSelectedFolder((current) => (current === name ? ALL_FOLDER : current));
  }, []);

  const value = useMemo(
    () => ({
      documents,
      isLoading,
      error,
      refresh,
      uploadDocument,
      toggleFavorite,
      removeDocument,
      replaceDocument,
      subjects,
      generalSubject,
      selectedFolder,
      setSelectedFolder,
      addSubject,
      removeSubject,
    }),
    [documents, isLoading, error, refresh, uploadDocument, toggleFavorite, removeDocument, replaceDocument,
      subjects, generalSubject, selectedFolder, addSubject, removeSubject]
  );

  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>;
};

export const useDocuments = () => {
  const context = useContext(DocumentsContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentsProvider');
  }
  return context;
};

// Subject to file a new upload/scan under, given the folder picked on Home
export const folderToSubject = (folder: string) => (folder === ALL_FOLDER ? undefined : folder);

// Confirm-then-delete used by every document list (hold a card, or its "..." menu)
export const useConfirmDeleteDocument = () => {
  const { removeDocument } = useDocuments();
  return useCallback((id: string, title: string, onDeleted?: () => void) => {
    Alert.alert(`Delete "${title}"?`, 'The file and its AI study material will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          removeDocument(id)
            .then(() => onDeleted?.())
            .catch((err) => Alert.alert('Could not delete', getErrorMessage(err))),
      },
    ]);
  }, [removeDocument]);
};
