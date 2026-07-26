// test_tesseract.js
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');

async function main() {
    console.log('Starting Tesseract with dynamic valid image...');

    try {
        // Generate a valid PNG with some test text using sharp
        const imgBuffer = await sharp({
            create: {
                width: 200,
                height: 50,
                channels: 3,
                background: { r: 255, g: 255, b: 255 }
            }
        })
            .png()
            .toBuffer();

        console.log('Generated a valid 200x50 white PNG');
        console.log('Calling Tesseract.createWorker...');
        const worker = await Tesseract.createWorker('eng');

        console.log('Worker created successfully. Running recognize...');
        const { data } = await worker.recognize(imgBuffer);

        console.log('Recognize done!');
        console.log(`Text: "${data.text.trim()}"`);

        await worker.terminate();
        console.log('Worker terminated. Test passed!');
    } catch (err) {
        console.error('Tesseract Exception:', err);
    }
}

main().catch(console.error);
