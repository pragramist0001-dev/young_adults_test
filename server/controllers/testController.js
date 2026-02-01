const Test = require('../models/Test');
const Question = require('../models/Question');
const { isDbConnected, readData, writeData } = require('../utils/fallbackStorage');

// Create a new Test
exports.createTest = async (req, res) => {
    try {
        const { subject, topic, count } = req.body;
        const teacherId = req.user.id;

        // Generate 4-digit code
        let accessCode;
        let isUnique = false;
        while (!isUnique) {
            accessCode = Math.floor(1000 + Math.random() * 9000).toString();
            // Check uniqueness
            if (!isDbConnected()) {
                const tests = readData('Test') || [];
                if (!tests.find(t => t.accessCode === accessCode)) isUnique = true;
            } else {
                const existing = await Test.findOne({ accessCode });
                if (!existing) isUnique = true;
            }
        }

        if (!isDbConnected()) {
            const allQuestions = readData('Question') || [];
            const subjectQuestions = allQuestions.filter(q => q.subject === subject && q.teacherId === teacherId);
            const selectedQuestions = subjectQuestions.sort(() => 0.5 - Math.random()).slice(0, count);
            const questionIds = selectedQuestions.map(q => q._id);

            const newTest = {
                _id: Date.now().toString(),
                teacherId,
                subject,
                topic,
                questions: questionIds,
                accessCode,
                count,
                isActive: true,
                createdAt: new Date().toISOString()
            };
            const tests = readData('Test') || [];
            tests.push(newTest);
            writeData('Test', tests);
            return res.status(201).json(newTest);
        }

        // DB Logic
        let questionIds;
        if (req.body.questions && req.body.questions.length > 0) {
            questionIds = req.body.questions;
        } else {
            const questions = await Question.aggregate([
                { $match: { subject, teacherId: new mongoose.Types.ObjectId(teacherId) } },
                { $sample: { size: Number(count) } }
            ]);
            questionIds = questions.map(q => q._id);
        }

        const newTest = new Test({
            teacherId,
            subject,
            topic,
            questions: questionIds,
            accessCode,
            count: questionIds.length
        });

        await newTest.save();
        res.status(201).json(newTest);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Teacher's Tests (Admin gets all)
exports.getMyTests = async (req, res) => {
    try {
        let filter = { teacherId: req.user._id, isActive: true };
        if (req.user.role === 'admin') {
            filter = { isActive: true };
        }

        if (!isDbConnected()) {
            const tests = readData('Test') || [];
            const filteredTests = req.user.role === 'admin'
                ? tests.filter(t => t.isActive === true)
                : tests.filter(t => t.teacherId === req.user.id && t.isActive === true);
            return res.json(filteredTests.reverse());
        }
        // Populate participants to get count
        const tests = await Test.find(filter)
            .sort({ createdAt: -1 })
            .select('-questions')
            .populate('teacherId', 'name');
        res.json(tests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Test By ID with Questions
exports.getTestById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isDbConnected()) {
            const tests = readData('Test') || [];
            const test = tests.find(t => t._id === id);
            if (!test) return res.status(404).json({ message: 'Test topilmadi' });

            // Get questions for this test
            const allQuestions = readData('Question') || [];
            const testQuestions = allQuestions.filter(q => test.questions.includes(q._id));

            return res.json({ ...test, questions: testQuestions });
        }

        const test = await Test.findById(id).populate('questions');

        if (!test) return res.status(404).json({ message: 'Test topilmadi' });

        // Check authorization
        // Check authorization
        if (test.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Ruxsat yo\'q' });
        }

        res.json(test);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addQuestions = async (req, res) => {
    try {
        const { id } = req.params;
        const { questions } = req.body; // Array of Question IDs

        if (!questions || questions.length === 0) {
            return res.status(400).json({ message: 'Savollar yo\'q' });
        }

        const test = await Test.findById(id);
        if (!test) return res.status(404).json({ message: 'Test topilmadi' });

        if (test.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Ruxsat yo\'q' });
        }

        // Add new unique IDs
        const newIds = questions.filter(qid => !test.questions.includes(qid));
        test.questions.push(...newIds);
        test.count = test.questions.length;

        await test.save();
        res.json(test);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete Test
exports.deleteTest = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isDbConnected()) {
            const tests = readData('Test') || [];
            const testIndex = tests.findIndex(t => t._id === id);

            if (testIndex === -1) {
                return res.status(404).json({ message: 'Test topilmadi' });
            }

            tests.splice(testIndex, 1);
            writeData('Test', tests);
            return res.json({ message: 'Test o\'chirildi' });
        }

        const test = await Test.findById(id);
        if (!test) return res.status(404).json({ message: 'Test topilmadi' });

        // Check authorization
        if (test.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Ruxsat yo\'q' });
        }

        await Test.findByIdAndDelete(id);
        res.json({ message: 'Test o\'chirildi' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
