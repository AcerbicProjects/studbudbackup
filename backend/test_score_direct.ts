import 'dotenv/config';
import { aiService } from './services/ai/ai.service';
import { contextManager } from './services/context/context.manager';

async function test() {
    try {
        contextManager.getDocumentContext = async () => {
            return { text: "2+2=4. Also, Paris is the capital of France. See page 2 for more.", subject: "Gen Knowledge", title: "Doc", chunksAvailable: 1 };
        };
        const mockQuestions = [{ id: "q1", question: "1+1?", correctAnswer: "2", options: ["1", "2"] }];
        const mockAnswers = { "q1": "1" }; // wrong answer

        const result = await aiService.scoreQuiz('docId', 'userId', JSON.stringify(mockQuestions), JSON.stringify(mockAnswers));
        console.log("Success:", result);
    } catch (err: any) {
        console.error("Failed stack:", err.stack);
    }
    process.exit(0);
}
test();
