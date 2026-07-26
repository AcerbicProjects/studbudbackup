import 'dotenv/config';
import { aiService } from './services/ai/ai.service';
import { contextManager } from './services/context/context.manager';
import fs from 'fs';

async function test() {
    try {
        contextManager.getDocumentContext = async () => {
            return { text: "2+2=4. Also, Paris is the capital of France. See page 2 for more.", subject: "Gen Knowledge", title: "Doc", chunksAvailable: 1 };
        };
        const mockQuestions = [{ id: "q0", question: "What is 2+2?", options: ["3", "4"], correctAnswer: "4" }];
        const mockAnswers = ["3"]; // I'll send it as array as frontend did initially, or as string

        const result = await aiService.scoreQuiz('docId', 'userId', JSON.stringify(mockQuestions), mockAnswers as any);

        fs.writeFileSync('score.json', JSON.stringify(result, null, 2), 'utf-8');
        console.log("Success");
    } catch (err: any) {
        fs.writeFileSync('score_err.txt', err.stack || err.message, 'utf-8');
        console.error("Failed:", err.message);
    }
    process.exit(0);
}
test();
