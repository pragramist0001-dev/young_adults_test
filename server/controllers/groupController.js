const Group = require('../models/Group');
const { isDbConnected, readData, writeData } = require('../utils/fallbackStorage');

exports.createGroup = async (req, res) => {
    try {
        const { name } = req.body;
        const teacherId = req.user.id;
        // Assuming subject is attached to user or passed in body. Using user's subject from auth or body.
        const subject = req.body.subject || req.user.subject;

        if (!isDbConnected()) {
            const groups = readData('Group') || [];
            const newGroup = {
                _id: Date.now().toString(),
                name,
                teacherId,
                subject,
                createdAt: new Date().toISOString()
            };
            groups.push(newGroup);
            writeData('Group', groups);
            return res.status(201).json(newGroup);
        }

        const newGroup = new Group({ name, teacherId, subject });
        await newGroup.save();
        res.status(201).json(newGroup);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMyGroups = async (req, res) => {
    try {
        let filter = { teacherId: req.user.id };
        if (req.user.role === 'admin') {
            filter = {};
        }

        if (!isDbConnected()) {
            const groups = readData('Group') || [];
            const filteredGroups = req.user.role === 'admin' ? groups : groups.filter(g => g.teacherId === req.user.id);
            return res.json(filteredGroups);
        }

        const groups = await Group.find(filter).populate('assignedTest').populate('teacherId', 'name');
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isDbConnected()) {
            const groups = readData('Group') || [];
            const newGroups = groups.filter(g => g._id !== id);
            writeData('Group', newGroups);
            return res.json({ message: 'Group deleted' });
        }
        await Group.findByIdAndDelete(id);
        res.json({ message: 'Group deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Assign Test to Group
exports.assignTestToGroup = async (req, res) => {
    try {
        const { id } = req.params; // Group ID
        const { testId } = req.body;

        if (!isDbConnected()) {
            const groups = readData('Group') || [];
            const group = groups.find(g => g._id === id);
            if (!group) return res.status(404).json({ message: 'Guruh topilmadi' });

            group.assignedTest = testId;
            // Also reset students in this group in local storage
            const students = readData('Student') || [];
            students.forEach(s => {
                if (s.groupId === id) {
                    s.status = 'pending';
                    s.score = 0;
                    s.testId = null;
                }
            });
            writeData('Student', students);

            writeData('Group', groups);
            return res.json(group);
        }

        const group = await Group.findById(id);
        if (!group) return res.status(404).json({ message: 'Guruh topilmadi' });

        group.assignedTest = testId;
        await group.save();

        // Reset all students in this group to 'pending' so they can take the new test
        const Student = require('../models/Student');
        await Student.updateMany(
            { groupId: id },
            { $set: { status: 'pending', score: 0, answers: [], testId: null } }
        );

        const populatedGroup = await Group.findById(id).populate('assignedTest');
        res.json(populatedGroup);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
