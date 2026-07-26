// backend/services/security/virus-scan.service.ts
import NodeClam from 'clamscan';

export interface ScanResult {
    clean: boolean;
    viruses: string[];
    skipped: boolean;
}

let clamInstance: any = null;
let initAttempted = false;

async function getClamInstance(): Promise<any | null> {
    if (initAttempted) return clamInstance;
    initAttempted = true;

    try {
        clamInstance = await new NodeClam().init({
            removeInfected: false,
            debugMode: false,
            scanRecursively: true,
            clamdscan: {
                socket: process.env.CLAM_SOCKET || null,
                host: process.env.CLAM_HOST || '127.0.0.1',
                port: Number(process.env.CLAM_PORT) || 3310,
                timeout: 60000,
                localFallback: true,
                path: process.env.CLAM_PATH || undefined,
                active: true,
            },
            preference: 'clamdscan',
        });
        console.log('✅ ClamAV initialized successfully');
        return clamInstance;
    } catch (err) {
        console.warn('⚠️  ClamAV not available – virus scanning disabled in dev.', (err as Error).message);
        clamInstance = null;
        return null;
    }
}

/**
 * Scan a file for viruses.
 * If ClamAV is not installed (dev environment), returns clean with skipped=true.
 */
export async function scanFile(filePath: string): Promise<ScanResult> {
    const clam = await getClamInstance();

    if (!clam) {
        console.warn(`⚠️  Virus scan skipped (ClamAV unavailable): ${filePath}`);
        return { clean: true, viruses: [], skipped: true };
    }

    try {
        const { isInfected, viruses } = await clam.isInfected(filePath);
        return {
            clean: !isInfected,
            viruses: viruses || [],
            skipped: false,
        };
    } catch (err) {
        console.error('Virus scan error:', err);
        // In production, you might want to throw instead of pass-through
        return { clean: true, viruses: [], skipped: true };
    }
}
