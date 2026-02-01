const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { createTask, getTasks, addMessage, updateStatus, deleteTask } = require('../controllers/taskController');

// Helper to disable admin check for development if needed, but for now enforcing strict roles
// Admin only creates tasks
router.post('/', protect, admin, createTask);

// Both can view (controller handles filtering)
router.get('/', protect, getTasks);

// Both can reply
router.post('/:id/message', protect, addMessage);

// Update status
router.put('/:id/status', protect, updateStatus);

// Delete task
router.delete('/:id', protect, admin, deleteTask);

module.exports = router;
