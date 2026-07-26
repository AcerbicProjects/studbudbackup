import 'dotenv/config';
import { groqClient } from './services/ai/groq.client';
import { aiParser } from './services/parsers/ai.parser';

async function run() {
    try {
        console.log('KEY:', process.env.GROQ_API_KEY ? 'Set' : 'Unset');
        const p = 'You are an evaluator. MUST Return JSON. {\"score\": 10, \"total\": 10, \"accuracy\": 100, \"weakTopics\": [], \"suggestedRevision\": [\"Read page 5\"], \"confidenceLevel\": \"high\"}';
        const text = await groqClient.generateText(p);
        console.log('GROQ TEXT:', text);
        const parsed = aiParser.parseQuizScore(text);
        console.log('PARSED:', parsed);
    } catch (e) {
        console.error('FAIL', e);
    }
}
run();
