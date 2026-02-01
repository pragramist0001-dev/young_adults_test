const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
    try {
        const adminEmail = 'admin@edutest.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            const admin = new User({
                name: 'System Admin',
                email: adminEmail,
                password: hashedPassword,
                plainPassword: 'admin123',
                role: 'admin',
                image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
            });

            await admin.save();
            console.log('✅ Default Admin created: admin@edutest.com / admin123');
        } else {
            console.log('ℹ️ Admin already exists');
        }
    } catch (err) {
        console.error('❌ Seed error:', err.message);
    }
};

module.exports = seedAdmin;
