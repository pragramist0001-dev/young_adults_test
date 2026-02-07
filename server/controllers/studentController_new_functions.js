// Request early access (Student)
exports.requestEarlyAccess = async (req, res) => {
    try {
        const { loginId } = req.body;

        if (!isDbConnected()) {
            const students = readData('Student');
            const studentIdx = students.findIndex(s => s.loginId === loginId);

            if (studentIdx === -1) {
                return res.status(404).json({ message: 'O\'quvchi topilmadi' });
            }

            // Reset approval request
            students[studentIdx].earlyAccessRequest = {
                requested: true,
                requestedAt: new Date().toISOString(),
                teacherApproved: false,
                adminApproved: false,
                approved: false,
                used: false
            };

            writeData('Student', students);
            return res.json({ message: 'So\'rov yuborildi. Ustoz va Admin tasdig\'ini kuting.' });
        }

        const student = await Student.findOne({ loginId });
        if (!student) {
            return res.status(404).json({ message: 'O\'quvchi topilmadi' });
        }

        // Reset and create new approval request
        student.earlyAccessRequest = {
            requested: true,
            requestedAt: new Date(),
            teacherApproved: false,
            adminApproved: false,
            approved: false,
            used: false
        };

        await student.save();
        res.json({ message: 'So\'rov yuborildi. Ustoz va Admin tasdig\'ini kuting.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get pending approval requests for teacher
exports.getPendingApprovals = async (req, res) => {
    try {
        if (!isDbConnected()) {
            const students = readData('Student') || [];
            const groups = readData('Group') || [];
            const myGroupIds = groups.filter(g => g.teacherId === req.user.id).map(g => g._id);

            const pending = students.filter(s =>
                s.earlyAccessRequest?.requested &&
                !s.earlyAccessRequest?.approved &&
                (s.teacherId === req.user.id || (s.groupId && myGroupIds.includes(s.groupId)))
            ).map(s => {
                const group = groups.find(g => g._id === s.groupId);
                return {
                    ...s,
                    groupId: group ? { _id: group._id, name: group.name } : null
                };
            });

            return res.json(pending);
        }

        const myGroups = await Group.find({ teacherId: req.user.id }).select('_id');
        const myGroupIds = myGroups.map(g => g._id);

        const students = await Student.find({
            'earlyAccessRequest.requested': true,
            'earlyAccessRequest.approved': false,
            $or: [
                { teacherId: req.user.id },
                { groupId: { $in: myGroupIds } }
            ]
        })
            .populate('groupId', 'name')
            .populate('teacherId', 'name')
            .sort({ 'earlyAccessRequest.requestedAt': -1 });

        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Teacher approves/rejects early access
exports.teacherApproveEarlyAccess = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { approved } = req.body;

        if (!isDbConnected()) {
            const students = readData('Student');
            const studentIdx = students.findIndex(s => s._id === studentId);

            if (studentIdx === -1) {
                return res.status(404).json({ message: 'O\'quvchi topilmadi' });
            }

            if (!students[studentIdx].earlyAccessRequest) {
                students[studentIdx].earlyAccessRequest = {};
            }

            students[studentIdx].earlyAccessRequest.teacherApproved = approved;
            students[studentIdx].earlyAccessRequest.teacherApprovedAt = new Date().toISOString();
            students[studentIdx].earlyAccessRequest.teacherApprovedBy = req.user.id;

            if (approved && students[studentIdx].earlyAccessRequest.adminApproved) {
                students[studentIdx].earlyAccessRequest.approved = true;
            } else {
                students[studentIdx].earlyAccessRequest.approved = false;
            }

            writeData('Student', students);
            return res.json({ message: approved ? 'Tasdiqlandi' : 'Rad etildi', student: students[studentIdx] });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'O\'quvchi topilmadi' });
        }

        if (!student.earlyAccessRequest) {
            student.earlyAccessRequest = {};
        }

        student.earlyAccessRequest.teacherApproved = approved;
        student.earlyAccessRequest.teacherApprovedAt = new Date();
        student.earlyAccessRequest.teacherApprovedBy = req.user.id;

        if (approved && student.earlyAccessRequest.adminApproved) {
            student.earlyAccessRequest.approved = true;
        } else {
            student.earlyAccessRequest.approved = false;
        }

        await student.save();
        res.json({ message: approved ? 'Tasdiqlandi' : 'Rad etildi', student });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Admin approves/rejects early access
exports.adminApproveEarlyAccess = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { approved } = req.body;

        if (!isDbConnected()) {
            const students = readData('Student');
            const studentIdx = students.findIndex(s => s._id === studentId);

            if (studentIdx === -1) {
                return res.status(404).json({ message: 'O\'quvchi topilmadi' });
            }

            if (!students[studentIdx].earlyAccessRequest) {
                students[studentIdx].earlyAccessRequest = {};
            }

            students[studentIdx].earlyAccessRequest.adminApproved = approved;
            students[studentIdx].earlyAccessRequest.adminApprovedAt = new Date().toISOString();
            students[studentIdx].earlyAccessRequest.adminApprovedBy = req.user.id;

            if (approved && students[studentIdx].earlyAccessRequest.teacherApproved) {
                students[studentIdx].earlyAccessRequest.approved = true;
            } else {
                students[studentIdx].earlyAccessRequest.approved = false;
            }

            writeData('Student', students);
            return res.json({ message: approved ? 'Tasdiqlandi' : 'Rad etildi', student: students[studentIdx] });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'O\'quvchi topilmadi' });
        }

        if (!student.earlyAccessRequest) {
            student.earlyAccessRequest = {};
        }

        student.earlyAccessRequest.adminApproved = approved;
        student.earlyAccessRequest.adminApprovedAt = new Date();
        student.earlyAccessRequest.adminApprovedBy = req.user.id;

        if (approved && student.earlyAccessRequest.teacherApproved) {
            student.earlyAccessRequest.approved = true;
        } else {
            student.earlyAccessRequest.approved = false;
        }

        await student.save();
        res.json({ message: approved ? 'Tasdiqlandi' : 'Rad etildi', student });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all pending approvals (Admin view)
exports.getAllPendingApprovals = async (req, res) => {
    try {
        if (!isDbConnected()) {
            const students = readData('Student') || [];
            const groups = readData('Group') || [];
            const users = readData('User') || [];

            const pending = students.filter(s =>
                s.earlyAccessRequest?.requested &&
                !s.earlyAccessRequest?.approved
            ).map(s => {
                const group = groups.find(g => g._id === s.groupId);
                const teacher = users.find(u => u._id === s.teacherId);
                return {
                    ...s,
                    groupId: group ? { _id: group._id, name: group.name } : null,
                    teacherId: teacher ? { _id: teacher._id, name: teacher.name } : null
                };
            });

            return res.json(pending);
        }

        const students = await Student.find({
            'earlyAccessRequest.requested': true,
            'earlyAccessRequest.approved': false
        })
            .populate('groupId', 'name')
            .populate('teacherId', 'name')
            .sort({ 'earlyAccessRequest.requestedAt': -1 });

        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
