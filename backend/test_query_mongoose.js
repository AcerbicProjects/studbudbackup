// test_query_mongoose.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Define schema exactly as in Document.ts
const DocumentSchema = new mongoose.Schema({}, { strict: false });
const Document = mongoose.model('Document', DocumentSchema);

async function main() {
    console.log('Connecting to:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Inspect all documents using Mongoose model
    const docs = await Document.find({});
    console.log('Documents Count:', docs.length);
    if (docs.length > 0) {
        console.log('Latest Document:', JSON.stringify(docs[docs.length - 1].toObject(), null, 2));
    }

    await mongoose.disconnect();
}

main().catch(console.error);
