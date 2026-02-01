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
        if (email === 'admin@edutest.com' && password === 'admin123') {
            return res.json({
                token: jwt.sign({ id: 'mock-admin', role: 'admin' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' }),
                user: { id: 'mock-admin', name: 'Boss Admin (Dev Mode)', email, role: 'admin' }
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
        if (!isDbConnected()) throw new Error('DB Disconnected');
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Ustoz bazadan o\'chirildi' });
    } catch (err) {
        // Fallback delete from JSON
        const teachers = readData('User');
        const filtered = teachers.filter(t => t._id !== req.params.id);
        writeData('User', filtered);
        res.json({ message: 'Ustoz (Local) o\'chirildi' });
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
            return res.json({
                _id: 'mock-admin',
                name: 'Boss Admin (Dev)',
                email: 'admin@edutest.com',
                role: 'admin'
            });
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

// Update Profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, password, image } = req.body;
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
