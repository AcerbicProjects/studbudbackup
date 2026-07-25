import vision from '@google-cloud/vision';

// Instantiates a client with optional resilience
let client: any = null;
try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        client = new vision.ImageAnnotatorClient();
    }
} catch (e) {
    console.warn('Failed to initialize Google Vision Client:', e);
}

export async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    if (!client) {
        console.warn('Google Application Credentials not configured. Returning OCR mock result.');
        return 'Mock OCR Result: Equation detected: f(x) = x^2 + 5x + 6.\nSolutions: x = -2, x = -3';
    }

    try {
        const [result] = await client.textDetection({ imageContent: imageBuffer });
        const detections = result.textAnnotations;
        return detections && detections[0] ? detections[0].description || '' : '';
    } catch (error) {
        console.error('Google Vision OCR Error:', error);
        return 'OCR Result: Error occurred during Google Vision execution. Make sure credentials are correct.';
    }
}
