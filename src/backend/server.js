const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(cors);
app.use(bodyParser.json());

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    console.log(`User logged in as: ${username}.`);

    res.json({ message: 'Login successful.', username });
})

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
})