const jwt = require('jsonwebtoken');
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
                quizContext: '[{"id":"q1","question":"1+1?","correctAnswer":"2","options":["1","2"],"explanation":"no"}]',
                userAnswers: "{\"q1\":\"2\"}"
            })
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log(data);
    } catch (err) {
        console.error(err);
    }
}
test();
