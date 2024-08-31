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
    const parsedData = JSON.parse(data);
    groups = parsedData.groups || [];
    users = parsedData.users || [];
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

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
})