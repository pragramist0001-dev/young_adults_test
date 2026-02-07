const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isDbConnected, readData, writeData } = require('../utils/fallbackStorage');

exports.register = async (req, res) => {
    const { name, email, password, role, subject } = req.body;

    // IMMEDIATE HYBRID CHECK: If DB is not connected, use local storage right away
    if (!isDbConnected()) {
        try {
            const teachers = readData('User');
            const existing = teachers.find(t => t.email === email);
            if (existing) return res.status(400).json({ message: 'User already exists (Local Mode)' });

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = {
                _id: Date.now().toString(),
                name, email,
                password: hashedPassword,
                plainPassword: password, // Save visible version
                role: role || 'teacher',
                subject,
                tasks: [],
                createdAt: new Date().toISOString()
            };

            teachers.push(newUser);
            writeData('User', teachers);
            return res.status(201).json({ message: 'Ustoz (Local Mode) muvaffaqiyatli saqlandi!', user: { name, subject } });
        } catch (e) {
            return res.status(500).json({ message: 'Local saqlashda xatolik: ' + e.message });
        }
    }

    try {
        // Normal MongoDB path
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name, email,
            password: hashedPassword,
            plainPassword: password, // Save visible version
            role: role || 'teacher',
            subject
        });

        await newUser.save();
        res.status(201).json({ message: 'Ustoz muvaffaqiyatli ro\'yxatdan o\'tkazildi', user: { name: newUser.name, subject: newUser.subject } });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Bazaga ulanishda xatolik: ' + err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // DEVELOPER BYPASS (For when MongoDB is not running)
        // DEVELOPER BYPASS (For when MongoDB is not running)
        if (email === 'admin@edutest.com' && password === 'admin123') {
            let adminUser = { id: 'mock-admin', name: 'Boss Admin (Dev Mode)', email, role: 'admin' };

            // Try to find persisted admin data (Local Mode)
            if (!isDbConnected()) {
                const users = readData('User');
                const found = users.find(u => u.email === 'admin@edutest.com' || u._id === 'mock-admin');
                if (found) adminUser = { ...found, id: found._id, role: 'admin' };
            } else {
                // Try to find in DB
                const found = await User.findOne({ email: 'admin@edutest.com' });
                if (found) adminUser = { ...found._doc, role: 'admin' };
            }

            return res.json({
                token: jwt.sign({ id: adminUser.id || adminUser._id, role: 'admin' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' }),
                user: adminUser
            });
        }

        // IMMEDIATE HYBRID CHECK: If DB is not connected, use local storage
        if (!isDbConnected()) {
            const users = readData('User');
            const user = users.find(u => u.email === email);
            if (!user) return res.status(400).json({ message: 'User topilmadi (Local Mode)' });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ message: 'Parol noto\'g\'ri' });

            const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

            return res.json({
                token,
                user: { id: user._id, name: user.name, email: user.email, role: user.role, subject: user.subject, image: user.image }
            });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User topilmadi' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Parol noto\'g\'ri' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, subject: user.subject, image: user.image } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server xatosi: ' + err.message });
    }
};

// Get all teachers
exports.getTeachers = async (req, res) => {
    try {
        if (!isDbConnected()) throw new Error('DB Disconnected');
        const teachers = await User.find({ role: 'teacher' }).select('-password');
        // plainPassword will be included because it's not excluded
        res.json(teachers);
    } catch (err) {
        // Fallback to local JSON
        const localTeachers = readData('User').filter(u => u.role === 'teacher').map(({ password, ...u }) => u);
        res.json(localTeachers);
    }
};

// Assign task to teacher
// Assign task to teacher
exports.assignTask = async (req, res) => {
    try {
        const { teacherId, taskText } = req.body;

        if (!isDbConnected()) {
            const teachers = readData('User');
            const teacherIdx = teachers.findIndex(t => t._id === teacherId);
            if (teacherIdx === -1) return res.status(404).json({ message: 'Ustoz (Local) topilmadi' });

            const newTask = {
                _id: Date.now().toString(),
                text: taskText,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            if (!teachers[teacherIdx].tasks) teachers[teacherIdx].tasks = [];
            teachers[teacherIdx].tasks.push(newTask);
            writeData('User', teachers);
            return res.json({ message: 'Vazifa (Local) yuborildi', tasks: teachers[teacherIdx].tasks });
        }

        const teacher = await User.findById(teacherId);
        if (!teacher) return res.status(404).json({ message: 'Ustoz topilmadi' });

        teacher.tasks.push({ text: taskText, status: 'pending' });
        await teacher.save();
        res.json({ message: 'Vazifa muvaffaqiyatli yuborildi', tasks: teacher.tasks });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete teacher
exports.deleteTeacher = async (req, res) => {
    try {
        const teacherId = req.params.id;

        if (!isDbConnected()) {
            const teachers = readData('User');
            const filteredTeachers = teachers.filter(t => String(t._id) !== String(teacherId));
            writeData('User', filteredTeachers);

            // Cascade delete locally

            // Delete Students (From Student collection)
            let students = readData('Student') || [];
            students = students.filter(s => {
                const sTeacherId = s.teacherId?._id ? String(s.teacherId._id) : String(s.teacherId);
                return sTeacherId !== String(teacherId);
            });
            writeData('Student', students);

            // Delete Tests
            let tests = readData('Test') || [];
            tests = tests.filter(t => {
                const tTeacherId = t.teacherId?._id ? String(t.teacherId._id) : String(t.teacherId);
                return tTeacherId !== String(teacherId);
            });
            writeData('Test', tests);

            // Delete Groups
            let groups = readData('Group') || [];
            groups = groups.filter(g => {
                const gTeacherId = g.teacherId?._id ? String(g.teacherId._id) : String(g.teacherId);
                return gTeacherId !== String(teacherId);
            });
            writeData('Group', groups);

            // Delete Tasks
            let tasks = readData('Task') || [];
            tasks = tasks.filter(t => {
                const tTeacherId = t.teacher?._id ? String(t.teacher._id) : String(t.teacher);
                return tTeacherId !== String(teacherId);
            });
            writeData('Task', tasks);

            return res.json({ message: 'Ustoz va barcha bog\'liq ma\'lumotlar (Local) o\'chirildi' });
        }

        // MongoDB Cascade Delete
        // 1. Delete the Teacher
        await User.findByIdAndDelete(teacherId);

        // 2. Delete Students associated with this teacher
        // Note: Students are in Student collection
        await require('../models/Student').deleteMany({ teacherId: teacherId });

        // 3. Delete Tests
        await require('../models/Test').deleteMany({ teacherId: teacherId });

        // 4. Delete Groups
        await require('../models/Group').deleteMany({ teacherId: teacherId });

        // 5. Delete Tasks
        await require('../models/Task').deleteMany({ teacher: teacherId });

        res.json({ message: 'Ustoz va barcha bog\'liq ma\'lumotlar bazadan o\'chirildi' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'O\'chirishda xatolik: ' + err.message });
    }
};

// Update Password (Admin Reset)
exports.updatePassword = async (req, res) => {
    try {
        const { teacherId, newPassword } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        if (!isDbConnected()) {
            const users = readData('User');
            const idx = users.findIndex(u => u._id === teacherId);
            if (idx !== -1) {
                users[idx].password = hashedPassword;
                users[idx].plainPassword = newPassword;
                writeData('User', users);
                return res.json({ message: 'Parol (Local Mode) yangilandi' });
            }
            return res.status(404).json({ message: 'Ustoz topilmadi' });
        }

        const user = await User.findById(teacherId);
        if (!user) return res.status(404).json({ message: 'Ustoz topilmadi' });

        user.password = hashedPassword;
        user.plainPassword = newPassword;
        await user.save();

        res.json({ message: 'Parol muvaffaqiyatli yangilandi' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Profile
exports.getProfile = async (req, res) => {
    try {
        // MOCK ADMIN BYPASS
        if (req.user.id === 'mock-admin') {
            let adminData = {
                _id: 'mock-admin',
                name: 'Boss Admin (Dev)',
                email: 'admin@edutest.com',
                role: 'admin'
            };

            // Attempt to find actual persisted admin image
            if (!isDbConnected()) {
                const users = readData('User');
                const found = users.find(u => u.email === 'admin@edutest.com' || u.role === 'admin' || u._id === 'mock-admin');
                if (found) {
                    adminData.image = found.image;
                    adminData.name = found.name;
                    adminData._id = found._id;
                }
            }

            return res.json(adminData);
        }

        if (!isDbConnected()) {
            const users = readData('User');
            const user = users.find(u => u._id === req.user.id);
            if (!user) return res.status(404).json({ message: 'User topilmadi (Local)' });
            const { password, ...userWithoutPassword } = user;
            return res.json(userWithoutPassword);
        }

        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



// Update Teacher (Admin)
exports.updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, subject, image } = req.body;

        if (!isDbConnected()) {
            const users = readData('User');
            const idx = users.findIndex(u => u._id === id);
            if (idx !== -1) {
                if (name) users[idx].name = name;
                if (email) users[idx].email = email;
                if (subject) users[idx].subject = subject;
                if (image) users[idx].image = image;
                writeData('User', users);
                return res.json({ message: 'Ustoz (Local) yangilandi', teacher: users[idx] });
            }
            return res.status(404).json({ message: 'Ustoz topilmadi' });
        }

        const teacher = await User.findById(id);
        if (!teacher) return res.status(404).json({ message: 'Ustoz topilmadi' });

        if (name) teacher.name = name;
        if (email) teacher.email = email;
        if (subject) teacher.subject = subject;
        if (image) teacher.image = image;

        await teacher.save();
        res.json({ message: 'Ustoz ma\'lumotlari yangilandi', teacher });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update Profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, password, image } = req.body;

        // MOCK ADMIN BYPASS - WITH PERSISTENCE
        if (req.user.id === 'mock-admin' || req.user.email === 'admin@edutest.com') {
            const adminData = {
                _id: 'mock-admin',
                name: name || 'Boss Admin (Dev)',
                email: email || 'admin@edutest.com',
                role: 'admin',
                image: image, // Save image
                subject: 'Admin'
            };

            if (!isDbConnected()) {
                const users = readData('User');
                const idx = users.findIndex(u => u.email === 'admin@edutest.com' || u._id === 'mock-admin');
                if (idx !== -1) {
                    if (name) users[idx].name = name;
                    if (email) users[idx].email = email;
                    if (image) users[idx].image = image;
                    users[idx].role = 'admin'; // FORCE ADMIN ROLE
                    writeData('User', users);
                    return res.json({ message: 'Admin profili yangilandi', user: users[idx] });
                } else {
                    // Create if not exists
                    users.push(adminData);
                    writeData('User', users);
                    return res.json({ message: 'Admin profili yaratildi', user: adminData });
                }
            } else {
                // DB Logic for Admin
                let user = await User.findOne({ email: 'admin@edutest.com' });
                if (!user) {
                    user = new User(adminData);
                    // Password handling might be needed if creating fresh, but this is a bypass update
                } else {
                    if (name) user.name = name;
                    if (email) user.email = email;
                    if (image) user.image = image;
                    user.role = 'admin'; // FORCE ADMIN ROLE
                }
                const saved = await user.save();
                return res.json({ message: 'Admin profili DB da yangilandi', user: saved });
            }
        }

        if (!isDbConnected()) {
            const users = readData('User');
            const idx = users.findIndex(u => u._id === req.user.id);
            if (idx !== -1) {
                if (name) users[idx].name = name;
                if (email) users[idx].email = email;
                if (image) users[idx].image = image;

                if (password) {
                    const salt = await bcrypt.genSalt(10);
                    users[idx].password = await bcrypt.hash(password, salt);
                    users[idx].plainPassword = password;
                }

                writeData('User', users);
                return res.json({ message: 'Profil (Local) yangilandi', user: { id: users[idx]._id, name: users[idx].name, email: users[idx].email, role: users[idx].role, image: users[idx].image, subject: users[idx].subject } });
            }
            return res.status(404).json({ message: 'User topilmadi (Local Mode)' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User topilmadi' });

        if (name) user.name = name;
        if (email) user.email = email;
        if (image) user.image = image;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            user.plainPassword = password;
        }

        await user.save();
        res.json({ message: 'Profil muvaffaqiyatli yangilandi', user: { id: user._id, name: user.name, email: user.email, role: user.role, image: user.image, subject: user.subject } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAdminInfo = async (req, res) => {
    try {
        let adminUser = { name: 'Admin', email: 'admin@edutest.com' };

        if (!isDbConnected()) {
            const users = readData('User');
            // Try to find by role 'admin' OR specific email
            const found = users.find(u => u.role === 'admin' || u.email === 'admin@edutest.com' || u._id === 'mock-admin');
            if (found) adminUser = { name: found.name, email: found.email, image: found.image };
        } else {
            const found = await User.findOne({ email: 'admin@edutest.com' });
            if (found) adminUser = { name: found.name, email: found.email, image: found.image };
        }

        res.json(adminUser);
    } catch (err) {
        res.status(500).json({ message: 'Admin info error' });
    }
};
