const express = require('express');
const router = express.Router();
const { readDataFile, writeDataFile } = require('../utils/fileUtils');

router.post('/register', async (req, res) => {
    const { username, email, password, role, groups } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    };

    try {
        const jsonData = await readDataFile();
        const usernameExists = jsonData.users.find((user) => user.username === username);
        const emailExists = jsonData.users.find((user) => user.email === email);

        if (usernameExists) {
            return res.status(400).json({ message: 'An account with that username already exists.' });
        } else if (emailExists) {
            return res.status(400).json({ message: 'An account with that email address already exists.' });
        };

        const newUser = {
            id: jsonData.users.length + 1,
            username,
            email,
            password,
            role: role || 'User',
            groups: groups || [],
        };

        jsonData.users.push(newUser);
        await writeDataFile(jsonData);
        res.status(201).json({ message: 'User successfully registered:', user: newUser });
    } catch (error) {
        return res.status(500).json({ message: 'Error reading data file.' });
    };
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Both a username and a password are required.' });
    };

    try {
        const jsonData = await readDataFile();
        const user = jsonData.users.find((u) => u.username === username && u.password === password);

        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        };

        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        return res.status(500).json({ message: 'Error reading data file.' });
    };
});

router.delete('/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid userId.' });
    };
    try {
        const data = await readDataFile();
        const userIndex = data.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found.' });
        };
        data.groups.forEach(group => {
            group.members = group.members.filter(memberId => memberId !== userId);
        });
        data.users.splice(userIndex, 1);
        await writeDataFile(data);
        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user.' });
    };
});

module.exports = router;