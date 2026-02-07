const express = require('express');
const router = express.Router();
const { getSubjects, addSubject, updateSubject } = require('../controllers/subjectController');
const { auth, admin } = require('../middleware/authMiddleware');

router.get('/', getSubjects);
router.post('/', auth, admin, addSubject);
router.put('/:name', auth, admin, updateSubject);
router.delete('/:name', auth, admin, require('../controllers/subjectController').deleteSubject);

module.exports = router;
