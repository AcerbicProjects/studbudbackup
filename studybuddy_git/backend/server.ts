import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import documentRouter from './routes/documents/document.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/documents', documentRouter);

// Health check route
app.get('/', (req, res) => {
    res.json({ message: 'StudyBuddy API is running' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
