const express = require('express');
const router = express.Router();
const { createGroup, getMyGroups, deleteGroup, assignTestToGroup, updateGroup } = require('../controllers/groupController');
// Update routes to allow admin access where necessary
const { protect, teacher, admin } = require('../middleware/authMiddleware');

// Custom middleware to allow Teacher OR Admin
const teacherOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Access Denied: Teachers or Admins only' });
    }
};

router.post('/', protect, teacherOrAdmin, createGroup);
router.get('/', protect, teacherOrAdmin, getMyGroups);
router.put('/:id/assign-test', protect, teacherOrAdmin, assignTestToGroup);
router.put('/:id', protect, teacherOrAdmin, updateGroup);
router.delete('/:id', protect, teacherOrAdmin, deleteGroup);

module.exports = router;
