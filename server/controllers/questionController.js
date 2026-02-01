const Question = require('../models/Question');
const { isDbConnected, readData, writeData } = require('../utils/fallbackStorage');

// Add new question (Teacher/Admin)
exports.createQuestion = async (req, res) => {
    try {
        const { questionText, options, correctOption, subject } = req.body;

        if (!isDbConnected()) {
            const questions = readData('Question');
            const newQ = {
                _id: Date.now().toString(),
                questionText,
                options,
                correctOption: Number(correctOption),
                subject,
                teacherId: req.user.id,
                createdAt: new Date().toISOString()
            };
            questions.push(newQ);
            writeData('Question', questions);
            return res.status(201).json(newQ);
        }

        const newQuestion = new Question({
            questionText,
            options,
            correctOption,
            subject,
            teacherId: req.user.id
        });

        await newQuestion.save();
        res.status(201).json(newQuestion);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get questions for Teachers (Includes correctOption)
exports.getQuestionsBySubject = async (req, res) => {
    try {
        const { subject } = req.params;

        if (!isDbConnected()) {
            const questions = readData('Question');
            const filtered = questions.filter(q => q.subject === subject && q.teacherId === req.user.id);
            return res.json(filtered);
        }

        const teacherId = req.user.id;
        const questions = await Question.find({ subject, teacherId });
        res.json(questions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get questions for Students (Randomized, Excludes correctOption)
exports.getQuestionsForTest = async (req, res) => {
    try {
        const { subject } = req.params;
        const count = parseInt(req.query.count) || 10;

        if (!isDbConnected()) {
            const questions = readData('Question');
            const filtered = questions.filter(q => q.subject === subject);
            const shuffled = filtered.sort(() => 0.5 - Math.random()).slice(0, count);
            const sanitized = shuffled.map(({ correctOption, ...rest }) => rest);
            return res.json(sanitized);
        }

        const questions = await Question.aggregate([
            { $match: { subject } },
            { $sample: { size: count } },
            { $project: { correctOption: 0 } }
        ]);

        res.json(questions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update Question
exports.updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { questionText, options, correctOption, subject } = req.body;

        if (!isDbConnected()) {
            const questions = readData('Question');
            const idx = questions.findIndex(q => q._id === id);
            if (idx === -1) return res.status(404).json({ message: 'Savol topilmadi' });

            questions[idx] = { ...questions[idx], questionText, options, correctOption: Number(correctOption), subject };
            writeData('Question', questions);
            return res.json(questions[idx]);
        }

        const updated = await Question.findByIdAndUpdate(id, { questionText, options, correctOption, subject }, { new: true });
        if (!updated) return res.status(404).json({ message: 'Savol topilmadi' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete Question
exports.deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isDbConnected()) {
            const questions = readData('Question');
            const filtered = questions.filter(q => q._id !== id);
            writeData('Question', filtered);
            return res.json({ message: 'Savol o\'chirildi' });
        }

        await Question.findByIdAndDelete(id);
        res.json({ message: 'Savol o\'chirildi' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
