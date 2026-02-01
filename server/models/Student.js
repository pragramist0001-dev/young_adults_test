const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    loginId: { type: String, unique: true, required: true }, // 4-digit ID
    phoneNumber: { type: String }, // Optional now
    chosenSubject: { type: String, required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }, // Optional group assignment
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'checked'], default: 'pending' },
    answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        selectedOption: String
    }],
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
    timeSpent: { type: String }, // Format: "00:00:00"
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);
