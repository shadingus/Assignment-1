const fs = require('fs/promises');
const path = require('path');
const dataFilePath = path.join(__dirname, '../data/data.json');

async function readDataFile() {
    try {
        const data = await fs.readFile(dataFilePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading data file:', err);
        throw err;
    };
};

async function writeDataFile(data) {
    try {
        await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error writing to data file:', err);
        throw err;
    };
};

module.exports = { readDataFile, writeDataFile };