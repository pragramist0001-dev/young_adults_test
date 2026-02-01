const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    plainPassword: { type: String }, // For admin visibility (as requested)
    image: { type: String }, // Profile picture URL or Base64
    role: { type: String, enum: ['admin', 'teacher'], default: 'teacher' },
    subject: { type: String }, // For teachers
    tasks: [{
        text: { type: String, required: true },
        status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
