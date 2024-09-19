const fs = require('fs/promises');
const path = require('path');
const dataFilePath = path.join(__dirname, '../data/data.json');

let cachedData = null;

async function loadData() {
    try {
        const data = await fs.readFile(dataFilePath, 'utf8');
        cachedData = JSON.parse(data);
        console.log('Data loaded into memory');
    } catch (err) {
        console.error('Error reading data file:', err);
        throw err;
    };
};

async function saveData() {
    try {
        await fs.writeFile(dataFilePath, JSON.stringify(cachedData, null, 2));
    } catch (err) {
        console.error('Error writing data to file:', err);
        throw err;
    };
};

function getCachedData() {
    return cachedData;
};

module.exports = { loadData, saveData, getCachedData };