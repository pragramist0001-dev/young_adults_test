const express = require('express');
const router = express.Router();
const { startTest, submitTest, getStudentResult, createStudent, getStudentsBySubject, deleteStudent, getStudentsByGroup, getAllStudents } = require('../controllers/studentController');
const { auth, admin } = require('../middleware/authMiddleware');

router.post('/start', startTest);
router.post('/submit', submitTest);

// Protected (Teacher/Admin)
router.post('/', auth, createStudent);
router.get('/list/:subject', auth, getStudentsBySubject);
router.get('/group/:groupId', auth, getStudentsByGroup);
router.delete('/:id', auth, deleteStudent);
router.get('/', auth, getAllStudents);

module.exports = router;
