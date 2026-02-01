const express = require('express');
const router = express.Router();
const { getSubjects, addSubject } = require('../controllers/subjectController');
const { auth, admin } = require('../middleware/authMiddleware');

router.get('/', getSubjects);
router.post('/', auth, admin, addSubject);
router.delete('/:name', auth, admin, require('../controllers/subjectController').deleteSubject);

module.exports = router;
