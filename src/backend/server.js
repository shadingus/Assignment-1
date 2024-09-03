const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const staticPath = path.join(__dirname, '../../dist/assignment-1/browser');
app.use(express.static(staticPath));

const DATA_FILE = path.join(__dirname, 'data.json');

let groups = [];
let users = [];

if (fs.existsSync(DATA_FILE)) {
    const data = fs.readFileSync(DATA_FILE);
    try {
        const parsedData = JSON.parse(data);
        groups = parsedData.groups || [];
        users = parsedData.users || [];
    } catch (error) {
        console.error('Error parsing JSON Data:', error)
    };
};

function saveData() {
    const data = { groups, users };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

app.get('/', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
})

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const user = users.find(user => user.username === username);

    if (!user) {
        return res.status(404).json({ error: 'User does not exist. Please contact the super admin to create your login credentials.' });
    }

    if (user.password !== password) {
        return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    res.json({
        message: 'Login successful.',
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            groups: user.groups
        },
     });
});

app.get('/users', (req, res) => {
    res.json(users);
});

app.post('/users', (req, res) => {
    const { username, email, password, role, groups = [] } = req.body;

    const existingUser = users.find(user => user.username === username);

    if (existingUser) {
        return res.status(400).json({ error: 'Username already exists.' });
    };

    const newUser = {
        id: users.length + 1,
        username,
        email,
        password,
        role,
        groups
    };
    users.push(newUser);
    saveData();
    res.json(newUser);
});

app.delete('/users/:id', (req, res) => {
    const userID = parseInt(req.params.id, 10);

    const userIndex = users.findIndex(user => user.id === userID);
    if (userIndex === -1) {
        return res.json(404).json({ error: 'User not found.' });
    };

    const removedUser = users.splice(userIndex, 1)[0];
    saveData();
    res.json(removedUser);
})

app.get('/groups', (req, res) => {
    res.json(groups);
});

app.post('/groups', (req, res) => {
    const { name } = req.body;
    const newGroup = { id: groups.length + 1, name };
    groups.push(newGroup);
    saveData();
    res.json(newGroup);
})

app.post('/groups/:groupId/add-user', (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = groups.find(group => group.id === parseInt(groupId, 10));
    const user = users.find(user => user.id === parseInt(userId, 10));

    if (!group) {
        return res.status(404).json({ error: 'Group not found.' });
    };

    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    };

    if (!user.groups.includes(group.name)) {
        user.groups.push(group.name);
        saveData();
        return res.json({ message: 'User added to group.', user });
    } else {
        return res.status(400).json({ error: 'User is already in this group.' });
    }
})

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
})