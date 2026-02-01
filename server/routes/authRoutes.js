const express = require('express');
const router = express.Router();
const { login, register, getTeachers, assignTask, deleteTeacher, updatePassword, getProfile, updateProfile } = require('../controllers/authController');
const { auth, admin } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/register', auth, admin, register);
router.get('/teachers', auth, admin, getTeachers);
router.post('/assign-task', auth, admin, assignTask);
router.delete('/teacher/:id', auth, admin, deleteTeacher);
router.post('/update-password', auth, admin, updatePassword);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

module.exports = router;
