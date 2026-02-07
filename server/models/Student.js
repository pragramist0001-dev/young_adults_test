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
    lastAccessDate: { type: Date }, // Track when student last submitted a test (for weekly access control)
    earlyAccessRequest: {
        requested: { type: Boolean, default: false },
        requestedAt: { type: Date },
        teacherApproved: { type: Boolean, default: false },
        teacherApprovedAt: { type: Date },
        teacherApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        adminApproved: { type: Boolean, default: false },
        adminApprovedAt: { type: Date },
        adminApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        approved: { type: Boolean, default: false }, // Both teacher and admin approved
        used: { type: Boolean, default: false } // Whether the approval was used (student logged in)
    }
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);
