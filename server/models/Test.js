const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    accessCode: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    count: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Test', TestSchema);
