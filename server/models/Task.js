const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    teacher: {
        type: String,
        ref: 'User',
        required: true
    },
    admin: {
        type: String,
        ref: 'User'
    },
    title: {
        type: String,
        default: 'Yangi Vazifa'
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending'
    },
    messages: [{
        sender: {
            type: String,
            enum: ['admin', 'teacher'],
            required: true
        },
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
