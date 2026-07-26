require('dotenv').config();
const axios = require('axios');
(async () => {
    try {
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@studybuddy.com',
            password: 'password123'
        });
        const token = login.data.token;
        console.log('TOKEN', token);
        const docsRes = await axios.get('http://localhost:5000/api/documents', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('DOCS count', docsRes.data.length);
        if (docsRes.data.length === 0) {
            console.log('No documents in DB');
            return;
        }
        const docId = docsRes.data[0]._id;
        console.log('DOC ID', docId);
        const quizRes = await axios.post('http://localhost:5000/api/ai/quiz', {
            documentId: docId,
            count: 20
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('QUIZ status', quizRes.status);
        console.log('QUIZ data', JSON.stringify(quizRes.data).substring(0, 500));
    } catch (e) {
        console.error('ERROR', e.response?.data || e.message);
    }
})();
