// backend/services/storage/cloudinary.service.ts
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import path from 'path';

// ── Configure Cloudinary ───────────────────────────────────────────────────────
let isConfiged = false;

function ensureConfigured(): void {
    if (isConfiged) return;
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    isConfiged = true;
}

const isConfigured = (): boolean => {
    return !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
};

// ── Types ──────────────────────────────────────────────────────────────────────
export interface CloudUploadResult {
    publicId: string;
    secureUrl: string;
    compressedUrl: string;
    format: string;
    bytes: number;
    width?: number;
    height?: number;
    pages?: number;
    thumbnails: {
        small: string;   // 150px
        medium: string;  // 400px
        large: string;   // 800px (first page for PDFs)
    };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Build a Cloudinary transformation URL */
function transformUrl(publicId: string, transforms: string, format: string): string {
    const base = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}`;
    // For PDFs, always use pg_1 to get the first page
    const ext = format === 'pdf' ? 'jpg' : format;
    const pgPrefix = format === 'pdf' ? 'pg_1,' : '';
    return `${base}/image/upload/${pgPrefix}${transforms}/${publicId}.${ext}`;
}

// ── Upload ─────────────────────────────────────────────────────────────────────
export async function uploadToCloudinary(
    filePath: string,
    options: { folder?: string; resourceType?: 'image' | 'raw' | 'auto' } = {}
): Promise<CloudUploadResult> {
    ensureConfigured();
    if (!isConfigured()) {
        throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
    }

    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const resourceType = options.resourceType || (ext === 'pdf' ? 'image' : 'auto');

    const result: UploadApiResponse = await cloudinary.uploader.upload(filePath, {
        folder: options.folder || 'studybuddy/documents',
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        // quality optimization for images
        ...(resourceType !== 'raw' && { quality: 'auto:good', fetch_format: 'auto' }),
    });

    const publicId = result.public_id;
    const format = result.format || ext;

    // Build thumbnail URLs via Cloudinary transformations
    const thumbnails = {
        small: transformUrl(publicId, 'w_150,h_150,c_fill,q_auto:low', format),
        medium: transformUrl(publicId, 'w_400,c_scale,q_auto:good', format),
        large: transformUrl(publicId, 'w_800,c_scale,q_auto:good', format),
    };

    // Compressed version
    const compressedUrl = transformUrl(publicId, 'q_auto:eco,f_auto', format);

    return {
        publicId,
        secureUrl: result.secure_url,
        compressedUrl,
        format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        pages: (result as any).pages,
        thumbnails,
    };
}

// ── Delete ─────────────────────────────────────────────────────────────────────
export async function deleteFromCloudinary(publicId: string): Promise<void> {
    ensureConfigured();
    if (!isConfigured()) return;
    await cloudinary.uploader.destroy(publicId);
}

export { isConfigured as isCloudinaryConfigured };
