import 'dotenv/config';
import mongoose from 'mongoose';
import { aiService } from './services/ai/ai.service';
import DocumentModel from './models/Document';
import fs from 'fs';

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        const doc = await (DocumentModel as any).findOne({ extractedText: { $exists: true } });
        if (!doc) throw new Error("No document found");

        const mockQuestions = [{ id: "q0", question: "What is 2+2?", options: ["3", "4"], correctAnswer: "4" }];
        const mockAnswers = { "q0": "3" };

        console.log(`Scoring quiz for ${doc._id}`);
        const result = await aiService.scoreQuiz(doc._id.toString(), doc.ownerId.toString(), JSON.stringify(mockQuestions), JSON.stringify(mockAnswers));

        fs.writeFileSync('score.json', JSON.stringify(result, null, 2), 'utf-8');
        console.log("Success");
    } catch (err: any) {
        fs.writeFileSync('score_err.txt', err.stack || err.message, 'utf-8');
        console.error("Failed:", err.message);
    }
    process.exit(0);
}
test();
