const fs = require("fs/promises");

async function readDataFile(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading data file:", err);
    throw err;
  }
}

async function writeDataFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing to data file:", err);
    throw err;
  }
}

module.exports = { readDataFile, writeDataFile };