const express = require('express');
const router = express.Router();
const {
    startTest,
    submitTest,
    getStudentResult,
    createStudent,
    getStudentsBySubject,
    deleteStudent,
    getStudentsByGroup,
    getAllStudents,
    getMyStudents,
    requestEarlyAccess,
    getPendingApprovals,
    teacherApproveEarlyAccess,
    adminApproveEarlyAccess,
    getAllPendingApprovals
} = require('../controllers/studentController');
const { auth, admin } = require('../middleware/authMiddleware');

router.post('/start', startTest);
router.post('/submit', submitTest);

// Early Access Approval Routes
router.post('/request-early-access', requestEarlyAccess); // Student requests early access (no auth)
router.get('/pending-approvals', auth, getPendingApprovals); // Teacher views their students' pending requests
router.post('/approve-early-access/:studentId', auth, teacherApproveEarlyAccess); // Teacher approves/rejects
router.get('/all-pending-approvals', auth, admin, getAllPendingApprovals); // Admin views all pending requests
router.post('/admin-approve-early-access/:studentId', auth, admin, adminApproveEarlyAccess); // Admin approves/rejects

// Protected (Teacher/Admin)
router.post('/', auth, createStudent);
router.get('/list/:subject', auth, getStudentsBySubject);
router.get('/mine', auth, getMyStudents);
router.get('/group/:groupId', auth, getStudentsByGroup);
router.delete('/:id', auth, deleteStudent);
router.get('/', auth, getAllStudents);

module.exports = router;
