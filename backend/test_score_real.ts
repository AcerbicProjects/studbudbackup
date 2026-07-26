import 'dotenv/config';
import mongoose from 'mongoose';
import { aiService } from './services/ai/ai.service';
import DocumentModel from './models/Document';
import fs from 'fs';

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        const doc = await DocumentModel.findOne({ extractedText: { $exists: true, $ne: '' } });
        if (!doc) throw new Error("No doc text");
        console.log("Doc:", doc._id);

        const mockQs = JSON.stringify([{ id: "q1", question: "What?", options: ["A"], correctAnswer: "A" }]);
        const mockAs = JSON.stringify({ q1: "B" });

        const result = await aiService.scoreQuiz(doc._id.toString(), doc.ownerId.toString(), mockQs, mockAs);
        console.log("Result:", result);
    } catch (err: any) {
        fs.writeFileSync('error_real.txt', err.stack);
        console.error("FAIL:", err.message);
    }
    process.exit(0);
}
test();
