import { groqClient } from './services/ai/groq.client';
import { aiParser } from './services/parsers/ai.parser';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        const p = 'You are an evaluator. JSON. {\"score\": 10, \"total\": 10, \"accuracy\": 100, \"weakTopics\": [], \"suggestedRevision\": [\"Read page 5\"], \"confidenceLevel\": \"high\"}';
        const text = await groqClient.generateText(p);
        console.log('GROQ TEXT:', text);
        const parsed = aiParser.parseQuizScore(text);
        console.log('PARSED:', parsed);
    } catch (e) {
        console.error('FAIL', e);
    }
}
run();
