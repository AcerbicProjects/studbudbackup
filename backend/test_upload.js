const fs = require('fs');

async function run() {
    try {
        console.log('1. Logging in...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test1@test.com', password: 'password123' })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
            throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
        }
        const { token } = loginData;

        console.log('2. Creating a dummy text file...');
        fs.writeFileSync('dummy.pdf', 'This is a dummy text file to test uploads.');

        console.log('3. Uploading dummy pdf file...');
        const formData = new FormData();
        const fileContent = fs.readFileSync('dummy.pdf');
        const blob = new Blob([fileContent], { type: 'application/pdf' });
        formData.append('file', blob, 'dummy.pdf');
        formData.append('title', 'Dummy Title');
        formData.append('subject', 'Mathematics');

        const uploadRes = await fetch('http://localhost:5000/api/documents/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const uploadData = await uploadRes.json();
        console.log('Upload response status:', uploadRes.status);
        console.log('Upload response data:', uploadData);

        fs.unlinkSync('dummy.pdf');
    } catch (err) {
        console.error('Error during test:', err);
    }
}

run();
