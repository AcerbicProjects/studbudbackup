// backend/test_pipeline.js
// Run: node test_pipeline.js
// Quick verification script for the upload & OCR pipeline

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5000';

function request(method, urlPath, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlPath, BASE);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method,
            headers,
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
        req.end();
    });
}

function uploadFile(urlPath, filePath, fields, token) {
    return new Promise((resolve, reject) => {
        const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
        const url = new URL(urlPath, BASE);

        let body = '';
        // Add text fields
        for (const [key, value] of Object.entries(fields)) {
            body += `--${boundary}\r\n`;
            body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
            body += `${value}\r\n`;
        }

        // Add file
        const fileContent = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);
        const ext = path.extname(fileName).toLowerCase();
        const mimeMap = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
        const mime = mimeMap[ext] || 'application/octet-stream';

        const headerPart = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mime}\r\n\r\n`;
        const closingPart = `\r\n--${boundary}--\r\n`;

        const bodyBuffer = Buffer.concat([
            Buffer.from(body + headerPart, 'utf8'),
            fileContent,
            Buffer.from(closingPart, 'utf8'),
        ]);

        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': bodyBuffer.length,
                Authorization: `Bearer ${token}`,
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', reject);
        req.write(bodyBuffer);
        req.end();
    });
}

async function main() {
    console.log('🧪 StudyBuddy Upload Pipeline Verification\n');

    // Step 1: Register a test user (or login if exists)
    console.log('1️⃣  Registering/logging in test user...');
    let token;
    const testUser = {
        fullName: 'Test User',
        email: 'pipeline_test@studybuddy.com',
        password: 'TestPass123!',
    };

    let res = await request('POST', '/api/auth/register', testUser, {
        'Content-Type': 'application/json',
    });
    if (res.status === 201) {
        token = res.body.token;
        console.log('   ✅ Registered new test user');
    } else {
        // Try login
        res = await request('POST', '/api/auth/login', { email: testUser.email, password: testUser.password }, {
            'Content-Type': 'application/json',
        });
        if (res.status === 200) {
            token = res.body.token;
            console.log('   ✅ Logged in as existing test user');
        } else {
            console.error('   ❌ Auth failed:', res.body);
            process.exit(1);
        }
    }

    // Step 2: Create a test image file
    console.log('\n2️⃣  Creating test image...');
    const testImagePath = path.join(__dirname, 'uploads', 'test_verify.png');

    // Create a valid white 200x50 PNG using sharp
    const sharp = require('sharp');
    await sharp({
        create: {
            width: 200,
            height: 50,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
        }
    })
        .png()
        .toFile(testImagePath);

    console.log('   ✅ Valid test PNG created');

    // Step 3: Upload the image
    console.log('\n3️⃣  Uploading test image...');
    const uploadRes = await uploadFile('/api/documents/upload', testImagePath, {
        title: 'Pipeline Test Image',
        subject: 'Verification',
    }, token);

    console.log(`   Status: ${uploadRes.status}`);
    if (uploadRes.status === 201) {
        const doc = uploadRes.body.document || uploadRes.body;
        console.log('   ✅ Upload successful!');
        console.log(`   📄 Document ID: ${doc._id}`);
        console.log(`   📋 Processing: ${uploadRes.body.processing || 'unknown'}`);

        if (uploadRes.body.jobId) {
            console.log(`   🔧 Job ID: ${uploadRes.body.jobId}`);
        }

        // Step 4: Wait and check document status
        console.log('\n4️⃣  Waiting 5 seconds for processing...');
        await new Promise((r) => setTimeout(r, 5000));

        const docRes = await request('GET', `/api/documents/${doc._id}`, null, {
            Authorization: `Bearer ${token}`,
        });

        if (docRes.status === 200) {
            const d = docRes.body;
            console.log('\n   📊 Document Status:');
            console.log(`      extractionStatus: ${d.extractionStatus}`);
            console.log(`      virusScanStatus:  ${d.virusScanStatus}`);
            console.log(`      cloudUrl:         ${d.cloudUrl || '(not set - check Cloudinary config)'}`);
            console.log(`      thumbnail:        ${d.thumbnail || '(not set)'}`);
            console.log(`      ocrProvider:      ${d.ocrProvider || '(not set)'}`);
            console.log(`      extractedText:    ${d.extractedText ? d.extractedText.substring(0, 100) + '...' : '(empty - expected for 1px test image)'}`);

            if (d.thumbnails) {
                console.log(`      thumbnails.small: ${d.thumbnails.small || '(not set)'}`);
                console.log(`      thumbnails.medium:${d.thumbnails.medium || '(not set)'}`);
            }

            // Summary
            console.log('\n   ═══════════════════════════════════');
            const checks = [
                ['Upload', uploadRes.status === 201],
                ['Cloud Storage', !!d.cloudUrl],
                ['Thumbnails', !!(d.thumbnails?.small || d.thumbnail)],
                ['Virus Scan', d.virusScanStatus !== 'pending'],
                ['OCR', !!d.ocrProvider || d.extractionStatus === 'completed'],
                ['Extraction', d.extractionStatus === 'completed' || d.extractionStatus === 'failed'],
            ];
            for (const [name, ok] of checks) {
                console.log(`   ${ok ? '✅' : '⚠️ '} ${name}`);
            }
            console.log('   ═══════════════════════════════════');
        }
    } else {
        console.log('   ❌ Upload failed:', JSON.stringify(uploadRes.body, null, 2));
    }

    // Cleanup
    try { fs.unlinkSync(testImagePath); } catch { }

    console.log('\n🏁 Verification complete!');
}

main().catch(console.error);
