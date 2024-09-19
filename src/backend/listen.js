const server = require('./server');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});