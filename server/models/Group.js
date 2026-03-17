const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    assignedTest: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', default: null },
    branch: { type: String, default: 'Asosiy' },
}, { timestamps: true });

module.exports = mongoose.model('Group', GroupSchema);
