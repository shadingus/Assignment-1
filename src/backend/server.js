const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
require('dotenv').config();

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
    const { username } = req.body;

    console.log(`User logged in as: ${username}`);

    res.json({ message: 'Login successful.', username });
})

port = process.env.PORT

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
})