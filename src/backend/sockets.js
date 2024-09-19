const { loadData, getCachedData, saveData } = require('./utils/dataCache');

// Function to handle user connection
const handleUserConnection = (socket) => {
    socket.on('userConnected', (username) => {
        socket.username = username;
        console.log(`User '${username}' connected.`);
        const data = getCachedData();
        const user = data.users.find(user => user.username === username);
        if (user) {
            const userGroups = data.groups.filter(group => group.members.includes(user.id) || user.role === 'Super Admin');
            socket.emit('userData', { user, groups: userGroups });
        } else {
            console.error(`User '${username}' not found in data.`);
        }
    });
};

// Function to handle user disconnection
const handleUserDisconnection = (socket) => {
    socket.on('userDisconnected', (username) => {
        console.log(`User '${username}' is trying to disconnect.`);
        socket.leaveAll();
        socket.removeAllListeners();
        socket.disconnect(true);
        console.log(`User '${username}' has disconnected. Socket ID: ${socket.id}`);
    });
};

// Function to handle joining a room
const handleJoinChannel = (nsSocket) => {
    nsSocket.on('joinRoom', (channelId) => {
        const room = `channel-${channelId}`;
        nsSocket.join(room);
        console.log(`User ${nsSocket.id} joined room: ${room}`);
    });
};

// Function to handle leaving a channel
const handleLeaveChannel = (nsSocket) => {
    nsSocket.on('leaveChannel', (channelId) => {
        const room = `channel-${channelId}`;
        nsSocket.leave(room);
        console.log(`A client (${nsSocket.id}) left channel ${room}`);
    });
};

// Function to handle leaving a group
const handleLeaveGroup = (nsSocket, groupId) => {
    nsSocket.on('leaveGroup', () => {
        console.log(`User disconnected from group ${groupId}: ${nsSocket.id}`);
        nsSocket.leaveAll();
    });
};

// Function to handle sending and receiving chat messages
const handleChatMessage = async (nsSocket, io, namespace, messageData) => {
    const { groupId, channelId } = messageData;
    const { username, message } = messageData.message;  // Correct destructuring
    console.log('Received groupId:', groupId);

    const room = `channel-${channelId}`;
    const jsonData = getCachedData();
    const groupData = jsonData.groups.find(g => g.id === groupId);

    if (!groupData) {
        console.error(`Group ${groupId} not found in data`);
        return;
    };

    const channel = groupData.channels.find(c => c.id === channelId);
    if (!channel) {
        console.error(`Channel ${channelId} not found in group ${groupId}`);
        return;
    };

    const newMessage = {
        username,
        message,
        timestamp: new Date().toISOString(),
    };

    channel.messages.push(newMessage);
    console.log(newMessage);
    await saveData(jsonData);

    // Broadcast the message to all clients in the room
    io.of(namespace).to(room).emit('chatMessage', {
        groupId: groupId,
        channelId: channelId,
        message: newMessage
    });
    console.log(`Message from ${username} in room ${room}: ${newMessage.message}`);
};

// Function to initialize the namespace for each group
const initGroup = (io, group) => {
    const namespace = `/group-${group.id}`;
    io.of(namespace).on('connection', nsSocket => {
        console.log(`User connected to namespace: ${namespace}`);

        handleJoinChannel(nsSocket);
        handleLeaveChannel(nsSocket);
        handleLeaveGroup(nsSocket, group.id);

        nsSocket.on('chatMessage', (messageData) => handleChatMessage(nsSocket, io, namespace, messageData));
    });
};

// Main function to initialize all sockets
const initializeSockets = (io) => {
    io.setMaxListeners(50);

    loadData().then(() => {
        const groups = getCachedData().groups;
        console.log(JSON.stringify(groups, null, 2));

        io.on('connection', (socket) => {
            console.log(`New Client Connected: ${socket.id}`);
            console.log(`Total Clients Connected: ${io.engine.clientsCount}`);
            handleUserConnection(socket);
            handleUserDisconnection(socket);
        });

        // Initialize namespace for each group
        groups.forEach(group => {
            initGroup(io, group);
        });
    }).catch((err) => {
        console.error('Error loading initial data:', err);
    });
};

module.exports = initializeSockets;