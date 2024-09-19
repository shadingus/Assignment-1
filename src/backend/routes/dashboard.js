const express = require('express');
const router = express.Router();
const { readDataFile } = require('../utils/fileUtils');

router.get('/dashboard-data', async (req, res) => {
  try {
    const data = await readDataFile();
    res.status(200).json({
        users: data.users,
        groups: data.groups
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  };
});

module.exports = router;