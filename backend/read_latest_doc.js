// read_latest_doc.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    const latestDoc = await db.collection('documents').find({}).sort({ createdAt: -1 }).limit(1).toArray();

    if (latestDoc.length === 0) {
        console.log('No documents found!');
    } else {
        const d = latestDoc[0];
        console.log('--- LATEST DOCUMENT ---');
        console.log('ID:', d._id);
        console.log('Title:', d.title);
        console.log('Extraction Status:', d.extractionStatus);
        console.log('Virus Scan Status:', d.virusScanStatus);
        console.log('Cloud URL:', d.cloudUrl);
        console.log('Thumbnail URL:', d.thumbnail);
        console.log('Thumbnails Medium URL:', d.thumbnails?.medium);
        console.log('OCR Provider:', d.ocrProvider);
        console.log('OCR Confidence:', d.ocrConfidence);
        console.log('Extracted Text length:', d.extractedText ? d.extractedText.length : 0);
    }

    await mongoose.disconnect();
}

main().catch(console.error);
