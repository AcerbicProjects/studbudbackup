// src/data/documents.ts
export type Document = {
    id: string;
    title: string;
    subject: string;
    pages: number;
    lastOpened: string; // ISO date
    studyTime: string; // e.g., '15m'
    progress: number; // 0-100
    favorite: boolean;
    thumbnail: string; // local asset path placeholder
};

export const documents: Document[] = [
    {
        id: '1',
        title: 'Physics Notes Chapter 4',
        subject: 'Physics',
        pages: 32,
        lastOpened: '2026-07-10T09:30:00Z',
        studyTime: '20m',
        progress: 45,
        favorite: false,
        thumbnail: 'placeholder_pdf.png',
    },
    {
        id: '2',
        title: 'DSA Mid Preparation',
        subject: 'Programming',
        pages: 58,
        lastOpened: '2026-07-11T14:12:00Z',
        studyTime: '35m',
        progress: 70,
        favorite: true,
        thumbnail: 'placeholder_pdf.png',
    },
    {
        id: '3',
        title: 'Linear Algebra Notes',
        subject: 'Mathematics',
        pages: 24,
        lastOpened: '2026-07-09T18:45:00Z',
        studyTime: '12m',
        progress: 30,
        favorite: false,
        thumbnail: 'placeholder_pdf.png',
    },
    // Add more mock documents as needed
];
