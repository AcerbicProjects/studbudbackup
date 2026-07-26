// backend/services/search/search.service.ts
import Document from '../../models/Document';
import { Types } from 'mongoose';
// import { getRedisClient } from '../../db/redis'; // removed unused import

/**
 * Build MongoDB aggregation pipeline for document search.
 * Supports full‑text search, filters, sorting, and pagination.
 */
export async function searchDocuments(params: {
    userId: string;
    query?: string;
    subject?: string;
    tags?: string[];
    fileType?: string;
    folderId?: string;
    favorite?: boolean;
    archived?: boolean;
    uploadSource?: 'camera' | 'upload';
    dateFrom?: Date;
    dateTo?: Date;
    sort?: 'newest' | 'oldest' | 'recentlyOpened' | 'mostStudied' | 'alphabetical' | 'largestFile';
    page?: number;
    limit?: number;
}): Promise<{ total: number; docs: any[] }> {
    const {
        userId,
        query,
        subject,
        tags,
        fileType,
        folderId,
        favorite,
        archived,
        uploadSource,
        dateFrom,
        dateTo,
        sort = 'newest',
        page = 1,
        limit = 20,
    } = params;

    const match: any = { ownerId: new Types.ObjectId(userId), deleted: false };

    if (query) {
        match.$text = { $search: query };
    }
    if (subject) match.subject = subject;
    if (favorite !== undefined) match.favorite = favorite;
    if (archived !== undefined) match.archived = archived;
    if (uploadSource) match.uploadSource = uploadSource;
    if (folderId) match.folderId = new Types.ObjectId(folderId);
    if (fileType) match.mimeType = { $regex: new RegExp(fileType, 'i') };
    if (tags && tags.length) match.tags = { $in: tags };
    if (dateFrom || dateTo) {
        match.uploadDate = {};
        if (dateFrom) match.uploadDate.$gte = dateFrom;
        if (dateTo) match.uploadDate.$lte = dateTo;
    }

    // Sorting map
    const sortMap: any = {
        newest: { uploadDate: -1 },
        oldest: { uploadDate: 1 },
        recentlyOpened: { lastOpenedAt: -1 },
        mostStudied: { studyTime: -1 },
        alphabetical: { title: 1 },
        largestFile: { fileSize: -1 },
    };

    const pipeline: any[] = [{ $match: match }];

    // Add text score projection if $text used
    if (query) {
        pipeline.push({ $addFields: { score: { $meta: 'textScore' } } });
        pipeline.push({ $sort: { score: { $meta: 'textScore' } } });
    }

    // Apply additional sort (overwrites textScore sort if both provided)
    pipeline.push({ $sort: sortMap[sort] || { uploadDate: -1 } });

    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip }, { $limit: limit });

    const [total, docs] = await Promise.all([
        Document.countDocuments(match),
        Document.aggregate(pipeline).exec(),
    ]);

    return { total, docs };
}
