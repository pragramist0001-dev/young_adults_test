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
                teacherId: req.user.id,
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

        // Check weekly access restriction
        if (student.lastAccessDate) {
            const lastAccess = new Date(student.lastAccessDate);
            const now = new Date();
            const daysSinceLastAccess = (now - lastAccess) / (1000 * 60 * 60 * 24);

            if (daysSinceLastAccess < 7) {
                // Check if student has valid early access approval (teacher approval only)
                const hasValidApproval = student.earlyAccessRequest?.teacherApproved;

                if (hasValidApproval) {
                    // Allow access - approval granted by teacher
                    // Note: approval will be reset when student completes the test and lastAccessDate is updated
                } else {
                    // Check if student has already requested early access
                    if (student.earlyAccessRequest?.requested) {
                        return res.status(403).json({
                            message: 'Ustoz ruxsatini kutmoqda. Ustoz tasdiqlashi bilan testga kirishingiz mumkin.',
                            canRequestEarlyAccess: false,
                            earlyAccessRequest: student.earlyAccessRequest
                        });
                    }

                    const nextAccessDate = new Date(lastAccess);
                    nextAccessDate.setDate(nextAccessDate.getDate() + 7);
                    const daysRemaining = Math.ceil(7 - daysSinceLastAccess);

                    return res.status(403).json({
                        message: `Test topshirish uchun 7 kunlik cheklov mavjud. Qayta kirish uchun ustozdan ruxsat so'rang.`,
                        nextAccessDate: nextAccessDate.toISOString(),
                        daysRemaining,
                        canRequestEarlyAccess: true,
                        earlyAccessRequest: student.earlyAccessRequest || null
                    });
                }
            }
        }

        const groups = readData('Group') || [];
        const group = groups.find(g => g._id === student.groupId);
        const tests = readData('Test') || [];
        const assignedTest = group ? tests.find(t => t._id === group.assignedTest) : null;

        if (student.status === 'checked') {
            const currentTestId = assignedTest?._id;
            const hasEarlyAccessApproval = student.earlyAccessRequest?.teacherApproved;

            // Only block if same test AND no early access approval
            if (currentTestId && student.testId === currentTestId && !hasEarlyAccessApproval) {
                return res.status(400).json({ message: 'Siz ushbu testni allaqachon topshirgansiz' });
            }
            // If early access approved or different test, allow them to enter (will overwrite old score)
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

        // Check weekly access restriction
        if (student.lastAccessDate) {
            const lastAccess = new Date(student.lastAccessDate);
            const now = new Date();
            const daysSinceLastAccess = (now - lastAccess) / (1000 * 60 * 60 * 24);

            if (daysSinceLastAccess < 7) {
                // Check if student has valid early access approval
                const hasValidApproval = student.earlyAccessRequest?.teacherApproved;

                if (hasValidApproval) {
                    // Allow access - continue to test
                } else {
                    // Check if student has already requested early access
                    if (student.earlyAccessRequest?.requested) {
                        return res.status(403).json({
                            message: 'Ustoz ruxsatini kutmoqda. Ustoz tasdiqlashi bilan testga kirishingiz mumkin.',
                            canRequestEarlyAccess: false,
                            earlyAccessRequest: student.earlyAccessRequest
                        });
                    }

                    const nextAccessDate = new Date(lastAccess);
                    nextAccessDate.setDate(nextAccessDate.getDate() + 7);
                    const daysRemaining = Math.ceil(7 - daysSinceLastAccess);

                    return res.status(403).json({
                        message: `Test topshirish uchun 7 kunlik cheklov mavjud. Qayta kirish uchun ustozdan ruxsat so'rang.`,
                        nextAccessDate: nextAccessDate.toISOString(),
                        daysRemaining,
                        canRequestEarlyAccess: true,
                        earlyAccessRequest: student.earlyAccessRequest || null
                    });
                }
            }
        }

        if (student.status === 'checked') {
            const currentTestId = student.groupId?.assignedTest?._id?.toString();
            const finishedTestId = student.testId?.toString();
            const hasEarlyAccessApproval = student.earlyAccessRequest?.teacherApproved;

            // Only block if same test AND no early access approval
            if (currentTestId && finishedTestId === currentTestId && !hasEarlyAccessApproval) {
                return res.status(400).json({ message: 'Siz allaqachon ushbu testni topshirgansiz' });
            }
            // If early access approved or different test, allow them to enter (will overwrite old score)
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
        student.lastAccessDate = new Date(); // Set last access date for weekly restriction

        // Reset early access request so student needs new approval for next time
        student.earlyAccessRequest = {
            requested: false,
            teacherApproved: false,
            adminApproved: false,
            approved: false
        };

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
                students[studentIdx].lastAccessDate = new Date().toISOString(); // Set last access date for weekly restriction

                // Reset early access request so student needs new approval for next time
                students[studentIdx].earlyAccessRequest = {
                    requested: false,
                    teacherApproved: false,
                    adminApproved: false,
                    approved: false
                };

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

            const users = readData('User') || [];

            const filtered = students.filter(s => s.chosenSubject === subject).map(s => {
                const group = groups.find(g => g._id === s.groupId);
                const teacher = users.find(u => u._id === s.teacherId);
                // Manually populate answers
                const populatedAnswers = (s.answers || []).map(ans => {
                    const qObj = questions.find(q => q._id === ans.questionId);
                    return { ...ans, questionId: qObj || null };
                });

                return {
                    ...s,
                    groupId: group ? { name: group.name } : null,
                    teacherId: teacher ? { name: teacher.name } : null,
                    answers: populatedAnswers
                };
            }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return res.json(filtered);
        }
        const students = await Student.find({ chosenSubject: subject })
            .populate('groupId', 'name')
            .populate('testId', 'topic')
            .populate('teacherId', 'name')
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

            const users = readData('User') || [];

            const populatedStudents = students.map(s => {
                const group = groups.find(g => g._id === s.groupId);
                const teacher = users.find(u => u._id === s.teacherId);
                const populatedAnswers = (s.answers || []).map(ans => {
                    const qObj = questions.find(q => q._id === ans.questionId);
                    return { ...ans, questionId: qObj || null };
                });
                return {
                    ...s,
                    groupId: group ? { _id: group._id, name: group.name } : null,
                    teacherId: teacher ? { _id: teacher._id, name: teacher.name } : null,
                    answers: populatedAnswers
                };
            });
            return res.json(populatedStudents);
        }
        const students = await Student.find()
            .populate('groupId', 'name')
            .populate('testId', 'topic')
            .populate('teacherId', 'name')
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
            const users = readData('User') || [];
            const groups = readData('Group') || []; // Added groups for groupId population
            const questions = readData('Question') || []; // Added questions for answers population

            const groupStudents = students.filter(s => s.groupId === groupId).map(s => {
                const group = groups.find(g => g._id === s.groupId); // Find group for _id
                const teacher = users.find(u => u._id === s.teacherId);
                const populatedAnswers = (s.answers || []).map(ans => {
                    const qObj = questions.find(q => q._id === ans.questionId);
                    return { ...ans, questionId: qObj || null };
                });
                return {
                    ...s,
                    groupId: group ? { _id: group._id, name: group.name } : null, // Populate with _id
                    teacherId: teacher ? { _id: teacher._id, name: teacher.name } : null, // Populate with _id
                    answers: populatedAnswers
                };
            });
            return res.json(groupStudents);
        }

        const students = await Student.find({ groupId })
            .populate('testId', 'topic')
            .populate('teacherId', 'name')
            .populate('answers.questionId')
            .sort({ createdAt: -1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// Get students by Teacher ID (My Students)
exports.getMyStudents = async (req, res) => {
    try {
        if (!isDbConnected()) {
            const students = readData('Student') || [];
            const groups = readData('Group') || [];
            const questions = readData('Question') || [];
            const users = readData('User') || [];

            // Find groups belonging to this teacher
            const myGroupIds = groups.filter(g => g.teacherId === req.user.id).map(g => g._id);

            const myStudents = students.filter(s =>
                s.teacherId === req.user.id || (s.groupId && myGroupIds.includes(s.groupId))
            ).map(s => {
                const group = groups.find(g => g._id === s.groupId);
                const teacher = users.find(u => u._id === s.teacherId);
                const populatedAnswers = (s.answers || []).map(ans => {
                    const qObj = questions.find(q => q._id === ans.questionId);
                    return { ...ans, questionId: qObj || null };
                });
                return {
                    ...s,
                    groupId: group ? { _id: group._id, name: group.name } : null,
                    teacherId: teacher ? { _id: teacher._id, name: teacher.name } : null,
                    answers: populatedAnswers
                };
            }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return res.json(myStudents);
        }

        // MongoDB Logic
        const myGroups = await Group.find({ teacherId: req.user.id }).select('_id');
        const myGroupIds = myGroups.map(g => g._id);

        const students = await Student.find({
            $or: [
                { teacherId: req.user.id },
                { groupId: { $in: myGroupIds } }
            ]
        })
            .populate('groupId', 'name')
            .populate('testId', 'topic')
            .populate('teacherId', 'name')
            .populate('answers.questionId')
            .sort({ createdAt: -1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// Request early access (Student)
exports.requestEarlyAccess = async (req, res) => {
    try {
        const { loginId } = req.body;

        if (!isDbConnected()) {
            const students = readData('Student');
            const studentIdx = students.findIndex(s => s.loginId === loginId);

            if (studentIdx === -1) {
                return res.status(404).json({ message: 'O\'quvchi topilmadi' });
            }

            // Reset approval request
            students[studentIdx].earlyAccessRequest = {
                requested: true,
                requestedAt: new Date().toISOString(),
                teacherApproved: false,
                adminApproved: false,
                approved: false,
                used: false
            };

            writeData('Student', students);
            return res.json({ message: 'So\'rov yuborildi. Ustoz tasdig\'ini kuting.' });
        }

        const student = await Student.findOne({ loginId });
        if (!student) {
            return res.status(404).json({ message: 'O\'quvchi topilmadi' });
        }

        // Reset and create new approval request
        student.earlyAccessRequest = {
            requested: true,
            requestedAt: new Date(),
            teacherApproved: false,
            adminApproved: false,
            approved: false,
            used: false
        };

        await student.save();
        res.json({ message: 'So\'rov yuborildi. Ustoz tasdig\'ini kuting.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get pending approval requests for teacher
exports.getPendingApprovals = async (req, res) => {
    try {
        if (!isDbConnected()) {
            const students = readData('Student') || [];
            const groups = readData('Group') || [];
            const myGroupIds = groups.filter(g => g.teacherId === req.user.id).map(g => g._id);

            const pending = students.filter(s =>
                s.earlyAccessRequest?.requested &&
                !s.earlyAccessRequest?.approved &&
                (s.teacherId === req.user.id || (s.groupId && myGroupIds.includes(s.groupId)))
            ).map(s => {
                const group = groups.find(g => g._id === s.groupId);
                return {
                    ...s,
                    groupId: group ? { _id: group._id, name: group.name } : null
                };
            });

            return res.json(pending);
        }

        const myGroups = await Group.find({ teacherId: req.user.id }).select('_id');
        const myGroupIds = myGroups.map(g => g._id);

        const students = await Student.find({
            'earlyAccessRequest.requested': true,
            'earlyAccessRequest.approved': false,
            $or: [
                { teacherId: req.user.id },
                { groupId: { $in: myGroupIds } }
            ]
        })
            .populate('groupId', 'name')
            .populate('teacherId', 'name')
            .sort({ 'earlyAccessRequest.requestedAt': -1 });

        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Teacher approves/rejects early access
exports.teacherApproveEarlyAccess = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { approved } = req.body;

        if (!isDbConnected()) {
            const students = readData('Student');
            const studentIdx = students.findIndex(s => s._id === studentId);

            if (studentIdx === -1) {
                return res.status(404).json({ message: 'O\'quvchi topilmadi' });
            }

            if (!students[studentIdx].earlyAccessRequest) {
                students[studentIdx].earlyAccessRequest = {};
            }

            students[studentIdx].earlyAccessRequest.teacherApproved = approved;
            students[studentIdx].earlyAccessRequest.teacherApprovedAt = new Date().toISOString();
            students[studentIdx].earlyAccessRequest.teacherApprovedBy = req.user.id;
            students[studentIdx].earlyAccessRequest.approved = approved; // Teacher approval is sufficient

            writeData('Student', students);
            return res.json({ message: approved ? 'Tasdiqlandi' : 'Rad etildi', student: students[studentIdx] });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'O\'quvchi topilmadi' });
        }

        if (!student.earlyAccessRequest) {
            student.earlyAccessRequest = {};
        }

        student.earlyAccessRequest.teacherApproved = approved;
        student.earlyAccessRequest.teacherApprovedAt = new Date();
        student.earlyAccessRequest.teacherApprovedBy = req.user.id;
        student.earlyAccessRequest.approved = approved; // Teacher approval is sufficient

        await student.save();
        res.json({ message: approved ? 'Tasdiqlandi' : 'Rad etildi', student });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Admin approves/rejects early access
exports.adminApproveEarlyAccess = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { approved } = req.body;

        if (!isDbConnected()) {
            const students = readData('Student');
            const studentIdx = students.findIndex(s => s._id === studentId);

            if (studentIdx === -1) {
                return res.status(404).json({ message: 'O\'quvchi topilmadi' });
            }

            if (!students[studentIdx].earlyAccessRequest) {
                students[studentIdx].earlyAccessRequest = {};
            }

            students[studentIdx].earlyAccessRequest.adminApproved = approved;
            students[studentIdx].earlyAccessRequest.adminApprovedAt = new Date().toISOString();
            students[studentIdx].earlyAccessRequest.adminApprovedBy = req.user.id;

            if (approved && students[studentIdx].earlyAccessRequest.teacherApproved) {
                students[studentIdx].earlyAccessRequest.approved = true;
            } else {
                students[studentIdx].earlyAccessRequest.approved = false;
            }

            writeData('Student', students);
            return res.json({ message: approved ? 'Tasdiqlandi' : 'Rad etildi', student: students[studentIdx] });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'O\'quvchi topilmadi' });
        }

        if (!student.earlyAccessRequest) {
            student.earlyAccessRequest = {};
        }

        student.earlyAccessRequest.adminApproved = approved;
        student.earlyAccessRequest.adminApprovedAt = new Date();
        student.earlyAccessRequest.adminApprovedBy = req.user.id;

        if (approved && student.earlyAccessRequest.teacherApproved) {
            student.earlyAccessRequest.approved = true;
        } else {
            student.earlyAccessRequest.approved = false;
        }

        await student.save();
        res.json({ message: approved ? 'Tasdiqlandi' : 'Rad etildi', student });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get pending approvals for teacher's students
exports.getPendingApprovals = async (req, res) => {
    try {
        const teacherId = req.user.id;

        if (!isDbConnected()) {
            const students = readData('Student') || [];
            const groups = readData('Group') || [];

            const pending = students.filter(s =>
                s.teacherId === teacherId &&
                s.earlyAccessRequest?.requested &&
                !s.earlyAccessRequest?.teacherApproved
            ).map(s => {
                const group = groups.find(g => g._id === s.groupId);
                return {
                    ...s,
                    groupId: group || null
                };
            });

            return res.json(pending);
        }

        const students = await Student.find({
            teacherId: teacherId,
            'earlyAccessRequest.requested': true,
            'earlyAccessRequest.teacherApproved': { $ne: true }
        })
            .populate('groupId', 'name')
            .sort({ 'earlyAccessRequest.requestedAt': -1 });

        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all pending approvals (Admin view)
exports.getAllPendingApprovals = async (req, res) => {
    try {
        if (!isDbConnected()) {
            const students = readData('Student') || [];
            const groups = readData('Group') || [];
            const users = readData('User') || [];

            const pending = students.filter(s =>
                s.earlyAccessRequest?.requested &&
                !s.earlyAccessRequest?.approved
            ).map(s => {
                const group = groups.find(g => g._id === s.groupId);
                const teacher = users.find(u => u._id === s.teacherId);
                return {
                    ...s,
                    groupId: group ? { _id: group._id, name: group.name } : null,
                    teacherId: teacher ? { _id: teacher._id, name: teacher.name } : null
                };
            });

            return res.json(pending);
        }

        const students = await Student.find({
            'earlyAccessRequest.requested': true,
            'earlyAccessRequest.approved': false
        })
            .populate('groupId', 'name')
            .populate('teacherId', 'name')
            .sort({ 'earlyAccessRequest.requestedAt': -1 });

        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
