const Subject = require('../models/Subject');
const { isDbConnected, readData, writeData } = require('../utils/fallbackStorage');

exports.getSubjects = async (req, res) => {
    try {
        if (!isDbConnected()) throw new Error('Offline');
        const subjects = await Subject.find();
        res.json(subjects.map(s => s.name));
    } catch (err) {
        // Fallback to local JSON or default list
        let subjects = readData('Subject');
        if (subjects.length === 0) {
            subjects = ['Kampyuter sovodhonligi', 'Front-end', 'Back-end', 'Ingliz tili', 'Dizayin'];
            writeData('Subject', subjects);
        }
        res.json(subjects);
    }
};

exports.addSubject = async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    if (!isDbConnected()) {
        try {
            const subjects = readData('Subject');
            if (subjects.includes(name)) return res.status(400).json({ message: 'Bu yo\'nalish allaqachon mavjud' });
            subjects.push(name);
            writeData('Subject', subjects);
            return res.status(201).json({ message: 'Yo\'nalish (Local) qo\'shildi', name });
        } catch (e) {
            return res.status(500).json({ message: e.message });
        }
    }

    try {
        const existing = await Subject.findOne({ name });
        if (existing) return res.status(400).json({ message: 'Bu yo\'nalish allaqachon mavjud' });

        const newSubject = new Subject({ name });
        await newSubject.save();
        res.status(201).json({ message: 'Yo\'nalish qo\'shildi', name });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteSubject = async (req, res) => {
    const { name } = req.params;

    if (!isDbConnected()) {
        try {
            let subjects = readData('Subject');
            const newSubjects = subjects.filter(s => s !== name);
            if (subjects.length === newSubjects.length) return res.status(404).json({ message: 'Yo\'nalish topilmadi' });

            writeData('Subject', newSubjects);
            return res.json({ message: 'Yo\'nalish o\'chirildi (Local)' });
        } catch (e) {
            return res.status(500).json({ message: e.message });
        }
    }

    try {
        const deleted = await Subject.findOneAndDelete({ name });
        if (!deleted) return res.status(404).json({ message: 'Yo\'nalish topilmadi' });
        res.json({ message: 'Yo\'nalish o\'chirildi' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
