const { loadData, getCachedData, saveData } = require("./utils/dataCache");

// Function to handle user connection
const handleUserConnection = (socket) => {
  socket.on("userConnected", (username) => {
    socket.username = username;
    console.log(`User '${username}' connected.`);
    const data = getCachedData();
    const user = data.users.find((user) => user.username === username);
    if (user) {
      const userGroups = data.groups.filter(
        (group) =>
          group.members.includes(user.id) || user.role === "Super Admin"
      );
      socket.emit("userData", { user, groups: userGroups });
    } else {
      console.error(`User '${username}' not found in data.`);
    }
  });
};

// Function to handle user disconnection
const handleUserDisconnection = (socket) => {
  socket.on("userDisconnected", (username) => {
    console.log(`User '${username}' is trying to disconnect.`);
    socket.leaveAll();
    socket.removeAllListeners();
    socket.disconnect(true);
    console.log(`User '${username}' has disconnected. Socket ID: ${socket.id}`);
  });
};

// Function to handle joining a room
const handleJoinChannel = (nsSocket) => {
  nsSocket.on("joinRoom", (channelId) => {
    const room = `channel-${channelId}`;
    nsSocket.join(room);
    console.log(`User ${nsSocket.id} joined room: ${room}`);
  });
};

// Function to handle leaving a channel
const handleLeaveChannel = (nsSocket) => {
  nsSocket.on("leaveChannel", (channelId) => {
    const room = `channel-${channelId}`;
    nsSocket.leave(room);
    console.log(`A client (${nsSocket.id}) left channel ${room}`);
  });
};

// Function to handle leaving a group
const handleLeaveGroup = (nsSocket, groupId) => {
  nsSocket.on("leaveGroup", () => {
    console.log(`User disconnected from group ${groupId}: ${nsSocket.id}`);
    nsSocket.leaveAll();
  });
};

// Function to handle sending and receiving chat messages
const handleChatMessage = async (nsSocket, io, namespace, messageData) => {
  const { groupId, channelId } = messageData;
  const { username, message } = messageData.message; // Correct destructuring
  const room = `channel-${channelId}`;
  try {
    const db = client.db("chatSystem");
    const channelsCollection = db.collection("channels");
    // Find the channel by groupId and channelId
    const channel = await channelsCollection.findOne({
      "id.0": groupId, // First part of the tuple is groupId
      "id.1": channelId, // Second part is channelNumber
    });
    if (!channel) {
      console.error(`Channel ${channelId} not found in group ${groupId}`);
      return;
    }
    // Create the new message object
    const newMessage = {
      username,
      message,
      timestamp: new Date().toISOString(),
    };
    // Push the new message to the channel's messages array in MongoDB
    await channelsCollection.updateOne(
      { "id.0": groupId, "id.1": channelId },
      { $push: { messages: newMessage } } // Push the new message to the messages array
    );
    // Broadcast the message to all clients in the room
    io.of(namespace).to(room).emit("chatMessage", {
      groupId: groupId,
      channelId: channelId,
      message: newMessage,
    });
    console.log(
      `Message from ${username} in channel ${room}: ${newMessage.message}`
    );
  } catch (error) {
    console.error("Error handling chat message:", error);
  }
};

// Function to initialize the namespace for each group
const initGroup = (io, group) => {
  const namespace = `/${group.id}`;
  io.of(namespace).on("connection", (nsSocket) => {
    console.log(`A user connected to group: ${namespace}`);

    handleJoinChannel(nsSocket);
    handleLeaveChannel(nsSocket);
    handleLeaveGroup(nsSocket, group.id);

    nsSocket.on("chatMessage", (messageData) =>
      handleChatMessage(nsSocket, io, namespace, messageData)
    );

    nsSocket.on("disconnect", () => {
      console.log(`A user disconnected from group: ${namespace}`);
      nsSocket.removeAllListeners();
    });
  });
};

// Main function to initialize all sockets
const initializeSockets = (io) => {
  io.setMaxListeners(50);

  loadData()
    .then(() => {
      const groups = getCachedData().groups;
      io.on("connection", (socket) => {
        console.log(`New Client Connected: ${socket.id}`);
        console.log(`Total Clients Connected: ${io.engine.clientsCount}`);
        handleUserConnection(socket);
        handleUserDisconnection(socket);
      });

      // Initialize namespace for each group
      groups.forEach((group) => {
        initGroup(io, group);
      });
    })
    .catch((err) => {
      console.error("Error loading initial data:", err);
    });
};

module.exports = initializeSockets;
