const express = require('express');
const router = express.Router();
const { createQuestion, getQuestionsBySubject, getQuestionsForTest, updateQuestion, deleteQuestion } = require('../controllers/questionController');
const { auth, admin } = require('../middleware/authMiddleware');

// Public (for students to take test)
router.get('/test/:subject', getQuestionsForTest);

// Protected (Admin/Teacher)
router.post('/', auth, createQuestion);
router.get('/manage/:subject', auth, getQuestionsBySubject);
router.put('/:id', auth, updateQuestion);
router.delete('/:id', auth, deleteQuestion);

module.exports = router;
