const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }], // Array of 4 options
    correctOption: { type: Number, required: true }, // Index (0-3)
    subject: { type: String, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    branch: { type: String, default: 'Asosiy' }
}, { timestamps: true });

module.exports = mongoose.model('Question', QuestionSchema);
