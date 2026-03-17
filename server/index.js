const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/tests', require('./routes/testRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));



app.get('/', (req, res) => {
    res.send('EduTest API Running');
});

// Serve static assets in production
const publicPath = path.join(__dirname, 'public');
if (process.env.NODE_ENV === 'production' || fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));

    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
        }
    });
}

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edutest')
    .then(() => {
        console.log('MongoDB connected successfully');
        require('./utils/seed')(); // Seed Admin
    })
    .catch((err) => console.error('MongoDB ulanishda xatolik:', err.message));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

