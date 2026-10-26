import apiClient from './apiClient';

// Uploads run OCR / PDF parsing on the server, which can take a while
const UPLOAD_TIMEOUT = 120000;

export type DocumentSource = 'upload' | 'scan';

export interface StudyDocument {
  _id: string;
  title: string;
  subject: string;
  source: DocumentSource;
  originalName: string;
  mimeType: string;
  size: number;
  pages: number;
  favorite: boolean;
  progress: number;
  studySeconds: number;
  lastOpened: string;
  createdAt: string;
  textLength: number;
  quizCount: number;
  lastQuizScore: number | null;
  bestQuizScore: number | null;
  lastQuizAt: string | null;
  fileUrl: string;
  textPreview?: string;
}

export interface SubjectsResponse {
  subjects: string[];
  general: string;
}

export interface UploadFile {
  uri: string;
  name: string;
  mimeType: string;
}

export const DocumentService = {
  async list(source?: DocumentSource): Promise<StudyDocument[]> {
    const response = await apiClient.get<StudyDocument[]>('/documents', { params: source ? { source } : undefined });
    return response.data;
  },

  async get(id: string): Promise<StudyDocument> {
    const response = await apiClient.get<StudyDocument>(`/documents/${id}`);
    return response.data;
  },

  async upload(
    file: UploadFile,
    options: { source?: DocumentSource; title?: string; subject?: string; pageImages?: UploadFile[] } = {},
    onProgress?: (percent: number) => void
  ): Promise<StudyDocument> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.mimeType,
      name: file.name,
    } as any);
    // Photos of each page of a scanned PDF, so the server can read them if needed
    (options.pageImages || []).forEach((page) => {
      formData.append('pages', { uri: page.uri, type: page.mimeType, name: page.name } as any);
    });
    if (options.source) formData.append('source', options.source);
    if (options.title) formData.append('title', options.title);
    if (options.subject) formData.append('subject', options.subject);

    const response = await apiClient.post<StudyDocument>('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: UPLOAD_TIMEOUT,
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    });
    return response.data;
  },

  async update(
    id: string,
    params: { title?: string; subject?: string; favorite?: boolean; progress?: number; addStudySeconds?: number }
  ): Promise<StudyDocument> {
    const response = await apiClient.patch<StudyDocument>(`/documents/${id}`, params);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/documents/${id}`);
  },

  async recordQuizAttempt(id: string, correct: number, total: number): Promise<StudyDocument> {
    const response = await apiClient.post<StudyDocument>(`/documents/${id}/quiz-attempt`, { correct, total });
    return response.data;
  },

  async getSubjects(): Promise<SubjectsResponse> {
    const response = await apiClient.get<SubjectsResponse>('/user/subjects');
    return response.data;
  },

  async addSubject(name: string): Promise<SubjectsResponse> {
    const response = await apiClient.post<SubjectsResponse>('/user/subjects', { name });
    return response.data;
  },

  async removeSubject(name: string): Promise<SubjectsResponse> {
    const response = await apiClient.delete<SubjectsResponse>(`/user/subjects/${encodeURIComponent(name)}`);
    return response.data;
  },
};

// Pull the server's message out of an axios error
export const getErrorMessage = (error: any, fallback = 'Something went wrong. Please try again.'): string => {
  if (error?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  return error?.response?.data?.message || error?.message || fallback;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
};

export const formatRelativeTime = (iso: string): string => {
  const diffSeconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 7 * 86400) return `${Math.floor(diffSeconds / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const formatStudyTime = (seconds: number): string => {
  if (seconds < 60) return '0m';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

export default DocumentService;
