const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const staticPath = path.join(__dirname, '../../dist/assignment-1/browser');
app.use(express.static(staticPath));

const users = [
  {
    id: 1,
    username: 'super',
    email: 'super@admin.com',
    password: '123',
    role: 'Super Admin',
    groups: ['Admin Chat']
  },
];

app.get('/', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});

app.post('/register', (req, res) => {
    const { username, email, password, role, groups } = req.body;

    const newUser = {
        id: users.length + 1,
        username,
        email,
        password,
        role,
        groups,
    }
    users.push(newUser);
    res.json({ message: 'User successfully registered', user: newUser });
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});