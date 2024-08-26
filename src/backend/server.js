var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var app = express();
const path = require('path');

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const staticPath = path.join(__dirname, '../../dist/assignment-1/browser');
app.use(express.static(staticPath));
console.log(__dirname);

app.get('/', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
})

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    console.log(`User logged in as: ${username} (Password: ${password}).`);

    res.json({ message: 'Login successful.', username });
})

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
})