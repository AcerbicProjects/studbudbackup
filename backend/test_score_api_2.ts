import 'dotenv/config';
import jwt from 'jsonwebtoken';
import fs from 'fs';

async function test() {
    const token = jwt.sign({ id: '6a5b816a9587fe88a82aa45d6' }, 'supersecretdev');
    try {
        const res = await fetch('http://127.0.0.1:5000/api/ai/quiz/score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                documentId: '6a5b816a9587fe88a82aa45d7',
                quizContext: '[]',
                userAnswers: '{"q1":"2"}'
            })
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Data:", data);
        fs.writeFileSync('score_api_test.json', JSON.stringify(data, null, 2));
    } catch (err: any) {
        console.error(err);
    }
    process.exit(0);
}
test();
