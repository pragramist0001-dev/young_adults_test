const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    assignedTest: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Group', GroupSchema);
