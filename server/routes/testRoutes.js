const express = require('express');
const router = express.Router();
const { createTest, getMyTests, getTestById, addQuestions, deleteTest } = require('../controllers/testController');
// Update routes to allow admin access
const { protect, teacher, admin } = require('../middleware/authMiddleware');

// Custom middleware
const teacherOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Access Denied: Teachers or Admins only' });
    }
};

router.post('/', protect, teacherOrAdmin, createTest);
router.get('/', protect, teacherOrAdmin, getMyTests);
router.get('/:id', protect, teacherOrAdmin, getTestById);
router.put('/:id/add', protect, teacherOrAdmin, addQuestions);
router.delete('/:id', protect, teacherOrAdmin, deleteTest);

module.exports = router;
