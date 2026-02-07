const Task = require('../models/Task');
const User = require('../models/User');
const mongoose = require('mongoose');
const { isDbConnected, readData, writeData } = require('../utils/fallbackStorage');

// Helper to check if a string is a valid ObjectId
const isObjectId = (id) => {
    return id && mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
};

// Create a new task (Admin sends first message)
exports.createTask = async (req, res) => {
    try {
        const { teacherId, text, title } = req.body;
        const sender = 'admin';

        if (!isDbConnected()) {
            const tasks = readData('Task');
            const newTask = {
                _id: 'local-' + Date.now(),
                teacher: teacherId,
                admin: req.user.id || 'mock-admin',
                title: title || 'Yangi Vazifa',
                status: 'pending',
                messages: [{ sender, text, createdAt: new Date() }],
                updatedAt: new Date(),
                createdAt: new Date()
            };
            tasks.push(newTask);
            writeData('Task', tasks);
            return res.status(201).json(newTask);
        }

        const newTask = new Task({
            teacher: teacherId,
            admin: req.user.id || 'mock-admin',
            title: title || 'Yangi Vazifa',
            messages: [{ sender, text }]
        });

        await newTask.save();
        res.status(201).json(newTask);
    } catch (err) {
        console.error('Create Task Error:', err);
        res.status(500).json({ message: err.message });
    }
};

// Get tasks
exports.getTasks = async (req, res) => {
    try {
        if (!isDbConnected()) {
            const allTasks = readData('Task');
            let filteredTasks;
            if (req.user.role === 'admin') {
                filteredTasks = allTasks;
            } else {
                filteredTasks = allTasks.filter(t => t.teacher === req.user.id);
            }
            // Populate teacher for local mode
            const users = readData('User');
            filteredTasks = filteredTasks.map(t => {
                const teacherObj = users.find(u => u._id === t.teacher);
                return {
                    ...t,
                    teacher: teacherObj ? { _id: teacherObj._id, name: teacherObj.name, email: teacherObj.email, subject: teacherObj.subject } : { name: 'Unknown' }
                };
            });
            filteredTasks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            return res.json(filteredTasks);
        }

        let tasks;
        if (req.user.role === 'admin') {
            const rawTasks = await Task.find().sort({ updatedAt: -1 }).lean();
            tasks = await Promise.all(rawTasks.map(async (task) => {
                let teacherDoc = null;
                if (isObjectId(task.teacher)) {
                    teacherDoc = await User.findById(task.teacher).select('name email subject').lean();
                }
                return {
                    ...task,
                    teacher: teacherDoc || { name: task.teacher || 'Unknown', email: 'mock@dev.com' }
                };
            }));
        } else {
            tasks = await Task.find({ teacher: req.user.id }).sort({ updatedAt: -1 });
        }
        res.json(tasks);
    } catch (err) {
        console.error('Get Tasks Error:', err);
        res.status(500).json({ message: err.message });
    }
};

// Add reply/message
exports.addMessage = async (req, res) => {
    try {
        const { text } = req.body;
        const sender = req.user.role === 'admin' ? 'admin' : 'teacher';

        if (!isDbConnected()) {
            const tasks = readData('Task');
            const idx = tasks.findIndex(t => t._id === req.params.id);
            if (idx === -1) return res.status(404).json({ message: 'Vazifa topilmadi' });

            tasks[idx].messages.push({ sender, text, createdAt: new Date() });
            tasks[idx].updatedAt = new Date();
            writeData('Task', tasks);
            return res.json(tasks[idx]);
        }

        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Vazifa topilmadi' });

        task.messages.push({ sender, text });
        await task.save();
        res.json(task);
    } catch (err) {
        console.error('Add Message Error:', err);
        res.status(500).json({ message: err.message });
    }
};

// Update status
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!isDbConnected()) {
            const tasks = readData('Task');
            const idx = tasks.findIndex(t => t._id === req.params.id);
            if (idx === -1) return res.status(404).json({ message: 'Vazifa topilmadi' });

            tasks[idx].status = status;
            tasks[idx].updatedAt = new Date();
            writeData('Task', tasks);
            return res.json(tasks[idx]);
        }

        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Vazifa topilmadi' });

        task.status = status;
        await task.save();
        res.json(task);
    } catch (err) {
        console.error('Update Status Error:', err);
        res.status(500).json({ message: err.message });
    }
};
// Delete task
exports.deleteTask = async (req, res) => {
    try {
        if (!isDbConnected()) {
            const tasks = readData('Task');
            const filteredTasks = tasks.filter(t => t._id !== req.params.id);
            if (tasks.length === filteredTasks.length) {
                return res.status(404).json({ message: 'Vazifa topilmadi' });
            }
            writeData('Task', filteredTasks);
            return res.json({ message: 'Vazifa o\'chirildi' });
        }

        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).json({ message: 'Vazifa topilmadi' });
        res.json({ message: 'Vazifa o\'chirildi' });
    } catch (err) {
        console.error('Delete Task Error:', err);
        res.status(500).json({ message: err.message });
    }
};
