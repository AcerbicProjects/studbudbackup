// backend/services/stats/stats.service.ts
import Document from '../../models/Document';
import Folder from '../../models/Folder';
import { Types } from 'mongoose';

/**
 * Returns aggregated statistics for a user's documents.
 * Includes total count, total storage size, total study time, subject breakdown, average pages, and recent uploads.
 */
export async function getUserStatistics(userId: string) {
    const ownerId = new Types.ObjectId(userId);

    const [docStats, folderStats] = await Promise.all([
        Document.aggregate([
            { $match: { ownerId, deleted: false } },
            {
                $group: {
                    _id: null,
                    totalDocuments: { $sum: 1 },
                    totalSize: { $sum: '$fileSize' },
                    totalStudyTime: { $sum: { $ifNull: ['$studyTime', 0] } },
                    averagePages: { $avg: '$pageCount' },
                    recentUploads: { $push: { _id: '$_id', uploadDate: '$uploadDate', title: '$title' } },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalDocuments: 1,
                    totalSize: 1,
                    totalStudyTime: 1,
                    averagePages: { $ifNull: ['$averagePages', 0] },
                    recentUploads: { $slice: ['$recentUploads', -5] }, // last 5 uploads
                },
            },
        ]),
        Folder.aggregate([
            { $match: { ownerId } },
            { $group: { _id: null, totalFolders: { $sum: 1 } } },
            { $project: { _id: 0, totalFolders: 1 } },
        ]),
    ]);

    const doc = docStats[0] || {
        totalDocuments: 0,
        totalSize: 0,
        totalStudyTime: 0,
        averagePages: 0,
        recentUploads: [],
    };
    const folder = folderStats[0] || { totalFolders: 0 };

    // Subject breakdown
    const subjectBreakdown = await Document.aggregate([
        { $match: { ownerId, deleted: false } },
        { $group: { _id: '$subject', count: { $sum: 1 } } },
        { $project: { _id: 0, subject: '$_id', count: 1 } },
    ]);

    return {
        totalDocuments: doc.totalDocuments,
        totalFolders: folder.totalFolders,
        totalSize: doc.totalSize,
        totalStudyTime: doc.totalStudyTime,
        averagePages: doc.averagePages,
        recentUploads: doc.recentUploads,
        subjectBreakdown,
    };
}
