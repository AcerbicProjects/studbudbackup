// test_db.js
const mongoose = require('mongoose');

async function checkUri(uri) {
    console.log(`Checking ${uri}...`);
    try {
        const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 2000 }).asPromise();
        console.log(`Connected to ${uri}`);
        const db = conn.db;
        const collections = await db.listCollections().toArray();
        console.log(`Collections in ${uri}:`, collections.map(c => c.name));

        for (const name of ['users', 'documents', 'jobs']) {
            if (collections.map(c => c.name).includes(name)) {
                const count = await db.collection(name).countDocuments();
                console.log(` - Collection '${name}' count: ${count}`);
                if (count > 0) {
                    const raw = await db.collection(name).find({}).sort({ createdAt: -1 }).limit(1).toArray();
                    console.log(`   Latest '${name}':`, JSON.stringify(raw, null, 2));
                }
            }
        }
        await conn.close();
    } catch (err) {
        console.log(`Failed to connect to ${uri}: ${err.message}`);
    }
}

async function main() {
    // Check local
    await checkUri('mongodb://localhost:27017/studybuddy');
    // Check Atlas
    const dotenv = require('dotenv');
    dotenv.config();
    if (process.env.MONGODB_URI) {
        await checkUri(process.env.MONGODB_URI);
    }
}

main().catch(console.error);
