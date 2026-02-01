const Student = require('../models/Student');
const Question = require('../models/Question');
const Group = require('../models/Group');
const Test = require('../models/Test');
const { isDbConnected, readData, writeData } = require('../utils/fallbackStorage');

// Helper to generate 4-digit ID
const generateId = async () => {
    let id;
    let exists = true;
    while (exists) {
        id = Math.floor(1000 + Math.random() * 9000).toString();
        if (!isDbConnected()) {
            const students = readData('Student');
            exists = students.some(s => s.loginId === id);
        } else {
            exists = await Student.findOne({ loginId: id });
        }
    }
    return id;
};

// Teacher creates student
exports.createStudent = async (req, res) => {
    try {
        const { fullName, chosenSubject, groupId } = req.body;
        const loginId = await generateId();

        if (!isDbConnected()) {
            const students = readData('Student');
            const newStudent = {
                _id: Date.now().toString(),
                fullName,
                loginId,
                chosenSubject,
                groupId: groupId || null,
                status: 'pending',
                score: 0,
                createdAt: new Date().toISOString()
            };
            students.push(newStudent);
            writeData('Student', students);
            return res.status(201).json(newStudent);
        }

        const student = new Student({
            fullName,
            loginId,
            chosenSubject,
            groupId,
            teacherId: req.user.id
        });
        await student.save();
        res.status(201).json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Student starts test with ID
exports.startTest = async (req, res) => {
    const { loginId } = req.body;

    if (!isDbConnected()) {
        const students = readData('Student');
        const student = students.find(s => s.loginId === loginId);
        if (!student) return res.status(404).json({ message: 'ID topilmadi' });

        const groups = readData('Group') || [];
        const group = groups.find(g => g._id === student.groupId);
        const tests = readData('Test') || [];
        const assignedTest = group ? tests.find(t => t._id === group.assignedTest) : null;

        if (student.status === 'checked') {
            const currentTestId = assignedTest?._id;
            if (currentTestId && student.testId === currentTestId) {
                return res.status(400).json({ message: 'Siz ushbu testni allaqachon topshirgansiz' });
            }
            // If it's a different test, we allow them to enter (it will overwrite their old score)
        }

        let questions = [];
        let testId = null;
        if (assignedTest) {
            testId = assignedTest._id;
            const allQuestions = readData('Question') || [];
            questions = allQuestions.filter(q => assignedTest.questions.includes(q._id));
        }

        return res.status(200).json({
            studentId: student._id,
            fullName: student.fullName,
            chosenSubject: student.chosenSubject,
            questions,
            testId,
            message: questions.length > 0 ? 'Testni boshlang' : 'Guruhga hali test biriktirilmagan'
        });
    }

    try {
        const student = await Student.findOne({ loginId }).populate({
            path: 'groupId',
            populate: { path: 'assignedTest' }
        });

        if (!student) return res.status(404).json({ message: 'ID topilmadi' });

        if (student.status === 'checked') {
            const currentTestId = student.groupId?.assignedTest?._id?.toString();
            const finishedTestId = student.testId?.toString();

            if (currentTestId && finishedTestId === currentTestId) {
                return res.status(400).json({ message: 'Siz allaqachon ushbu testni topshirgansiz' });
            }
            // Allow if a different test is now assigned
        }

        let questions = [];
        let testId = null;

        if (student.groupId && student.groupId.assignedTest) {
            const test = student.groupId.assignedTest;
            testId = test._id;
            // Fetch the actual questions
            questions = await Question.find({ _id: { $in: test.questions } });
        }

        res.status(200).json({
            studentId: student._id,
            fullName: student.fullName,
            chosenSubject: student.chosenSubject,
            questions: questions,
            testId: testId,
            message: questions.length > 0 ? 'Testni boshlang' : 'Guruhga hali test biriktirilmagan'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.submitTest = async (req, res) => {
    try {
        const { studentId, answers } = req.body;

        if (!isDbConnected()) throw new Error('Offline');

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        if (student.status === 'checked') return res.status(400).json({ message: 'Allaqachon topshirilgan.' });

        let score = 0;
        let correctCount = 0;
        let wrongCount = 0;
        const processedAnswers = [];

        for (let ans of answers) {
            const question = await Question.findById(ans.questionId);
            if (question) {
                const isCorrect = question.options[question.correctOption] === ans.selectedOption;
                if (isCorrect) {
                    score++;
                    correctCount++;
                } else {
                    wrongCount++;
                }
                processedAnswers.push({ questionId: question._id, selectedOption: ans.selectedOption });
            }
        }

        student.score = score;
        student.correctCount = correctCount;
        student.wrongCount = wrongCount;
        student.timeSpent = req.body.timeSpent || "00:00";
        student.answers = processedAnswers;
        student.status = 'checked';
        student.testId = req.body.testId || null;
        await student.save();

        // Add student to Test participants if test access code is known or inferred
        // NOTE: In this flow, we might need to find the test by checking which test contains these questions or if we allow passing testId.
        // For simplicity, we assume we can match via the active test for this subject or if we pass testAccessCode from frontend.
        if (req.body.testId) {
            const Test = require('../models/Test');
            await Test.findByIdAndUpdate(req.body.testId, { $addToSet: { participants: student._id } });
        } else if (req.body.accessCode) {
            const Test = require('../models/Test');
            await Test.findOneAndUpdate({ accessCode: req.body.accessCode }, { $addToSet: { participants: student._id } });
        }

        res.json({ message: 'Natijangiz saqlandi', score });
    } catch (err) {
        // Local fallback for submission
        try {
            const students = readData('Student');
            const questions = readData('Question') || [];
            const studentIdx = students.findIndex(s => s._id === req.body.studentId);

            if (studentIdx !== -1) {
                const answers = req.body.answers || [];
                let score = 0;
                let correctCount = 0;
                let wrongCount = 0;
                const processedAnswers = [];

                for (let ans of answers) {
                    const question = questions.find(q => q._id === ans.questionId);
                    if (question) {
                        const isCorrect = question.options[question.correctOption] === ans.selectedOption;
                        if (isCorrect) {
                            score++;
                            correctCount++;
                        } else {
                            wrongCount++;
                        }
                        processedAnswers.push({ questionId: question._id, selectedOption: ans.selectedOption });
                    }
                }

                students[studentIdx].status = 'checked';
                students[studentIdx].score = score;
                students[studentIdx].correctCount = correctCount;
                students[studentIdx].wrongCount = wrongCount;
                students[studentIdx].timeSpent = req.body.timeSpent || "00:00";
                students[studentIdx].answers = processedAnswers;
                students[studentIdx].testId = req.body.testId || null;

                writeData('Student', students);
                return res.json({ message: 'Natija (Local Mode) saqlandi', score });
            }
        } catch (e) { console.error('Local save error:', e); }
        res.status(500).json({ error: err.message });
    }
};

exports.getStudentsBySubject = async (req, res) => {
    try {
        const { subject } = req.params;
        if (!isDbConnected()) {
            const students = readData('Student');
            const groups = readData('Group') || [];
            const questions = readData('Question') || [];

            const filtered = students.filter(s => s.chosenSubject === subject).map(s => {
                const group = groups.find(g => g._id === s.groupId);
                // Manually populate answers
                const populatedAnswers = (s.answers || []).map(ans => {
                    const qObj = questions.find(q => q._id === ans.questionId);
                    return { ...ans, questionId: qObj || null };
                });

                return {
                    ...s,
                    groupId: group ? { name: group.name } : null,
                    answers: populatedAnswers
                };
            }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return res.json(filtered);
        }
        const students = await Student.find({ chosenSubject: subject })
            .populate('groupId', 'name')
            .populate('testId', 'topic')
            .populate('answers.questionId')
            .sort({ createdAt: -1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isDbConnected()) {
            const students = readData('Student');
            const filtered = students.filter(s => s._id !== id);
            writeData('Student', filtered);
            return res.json({ message: 'O\'quvchi o\'chirildi' });
        }
        await Student.findByIdAndDelete(id);
        res.json({ message: 'O\'quvchi o\'chirildi' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all students (Admin)
// Get all students (Admin)
exports.getAllStudents = async (req, res) => {
    try {
        if (!isDbConnected()) {
            const students = readData('Student');
            const groups = readData('Group') || [];
            const questions = readData('Question') || [];

            const populatedStudents = students.map(s => {
                const group = groups.find(g => g._id === s.groupId);
                const populatedAnswers = (s.answers || []).map(ans => {
                    const qObj = questions.find(q => q._id === ans.questionId);
                    return { ...ans, questionId: qObj || null };
                });
                return { ...s, groupId: group ? { name: group.name } : null, answers: populatedAnswers };
            });
            return res.json(populatedStudents);
        }
        const students = await Student.find()
            .populate('groupId', 'name')
            .populate('testId', 'topic')
            .populate('answers.questionId')
            .sort({ createdAt: -1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get students by group ID
exports.getStudentsByGroup = async (req, res) => {
    try {
        const { groupId } = req.params;

        if (!isDbConnected()) {
            const students = readData('Student') || [];
            const groupStudents = students.filter(s => s.groupId === groupId);
            return res.json(groupStudents);
        }

        const students = await Student.find({ groupId })
            .populate('testId', 'topic')
            .populate('answers.questionId')
            .sort({ createdAt: -1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
