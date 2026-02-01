const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

const getFilePath = (modelName) => path.join(DATA_DIR, `${modelName.toLowerCase()}s.json`);

const readData = (modelName) => {
    const filePath = getFilePath(modelName);
    if (!fs.existsSync(filePath)) return [];
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (e) {
        return [];
    }
};

const writeData = (modelName, data) => {
    const filePath = getFilePath(modelName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Helper to check if Mongoose is actually connected
const isDbConnected = () => {
    const mongoose = require('mongoose');
    return mongoose.connection.readyState === 1; // 1 = connected
};

module.exports = {
    readData,
    writeData,
    isDbConnected
};
