// Type declarations for modules without TypeScript definitions

declare module 'clamscan' {
    interface ClamScanOptions {
        removeInfected?: boolean;
        debugMode?: boolean;
        scanRecursively?: boolean;
        clamdscan?: {
            socket?: string | null;
            host?: string;
            port?: number;
            timeout?: number;
            localFallback?: boolean;
            path?: string;
            active?: boolean;
        };
        preference?: string;
    }

    interface ScanResult {
        isInfected: boolean;
        viruses?: string[];
    }

    class NodeClam {
        init(options: ClamScanOptions): Promise<NodeClam>;
        isInfected(filePath: string): Promise<ScanResult>;
    }

    export = NodeClam;
}
