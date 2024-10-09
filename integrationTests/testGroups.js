const express = require("express");
const router = express.Router();
const { readDataFile, writeDataFile } = require("./testFileUtils");

// Create Group
router.post("/create", async (req, res) => {
  const { id, name, channels, members, creatorId } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Group name is required." });
  }
  try {
    const data = await readDataFile(req.dataFilePath); // Use req.dataFilePath for test data
    const user = data.users.find((u) => u.id === members[0]);
    const newGroup = {
      id,
      name,
      channels,
      members,
      creatorId,
    };
    data.groups.push(newGroup);
    user.groups.push(newGroup.id);
    await writeDataFile(req.dataFilePath, data); // Use req.dataFilePath for test data
    res
      .status(201)
      .json({ message: "Group created successfully", group: newGroup });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Error creating group." });
  }
});

// Get Group
router.get("/:groupId", async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const userId = parseInt(req.query.userId);
  const userRole = req.query.userRole;
  try {
    const data = await readDataFile(req.dataFilePath); // Use req.dataFilePath for test data
    const group = data.groups.find((g) => g.id === groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (userRole === "Super Admin" || group.members.includes(userId)) {
      return res.status(200).json(group);
    } else {
      return res
        .status(403)
        .json({ message: "You do not have access to this group." });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching group data." });
  }
});

// Delete Group
router.delete(
  "/delete/:groupId/:currentUserId/:currentUserRole",
  async (req, res) => {
    const groupId = req.params.groupId;
    const currentUserId = req.params.currentUserId;
    const currentUserRole = req.params.currentUserRole;
    try {
      const data = await readDataFile(req.dataFilePath); // Use req.dataFilePath for test data
      const group = data.groups.find((g) => g.id === groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found." });
      }
      if (
        currentUserRole !== "Super Admin" &&
        group.creatorId !== parseInt(currentUserId)
      ) {
        return res
          .status(403)
          .json({ message: "You do not have permission to delete this group" });
      }
      data.groups = data.groups.filter((g) => g.id !== groupId);
      await writeDataFile(req.dataFilePath, data); // Use req.dataFilePath for test data
      return res.status(200).json({ message: "Group deleted successfully" });
    } catch (error) {
      console.error("Error deleting group:", error);
      return res.status(500).json({ message: "Error deleting group." });
    }
  }
);

// Add User to Group
router.post("/:groupId/add-user/:userId", async (req, res) => {
  const { role } = req.body;
  const { groupId, userId } = req.params;
  try {
    const data = await readDataFile(req.dataFilePath); // Use req.dataFilePath for test data
    const user = data.users.find((u) => u.id === Number(userId));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const group = data.groups.find((g) => g.id === groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (role !== "Super Admin" && group.creatorId !== user.id) {
      return res.status(403).json({
        message: "You are not authorized to add users to this group.",
      });
    }
    if (!group.members.includes(user.id)) {
      group.members.push(user.id);
      user.groups.push(group.id);
      await writeDataFile(req.dataFilePath, data); // Use req.dataFilePath for test data
      return res
        .status(200)
        .json({ message: "User added to the group successfully" });
    } else {
      return res
        .status(400)
        .json({ message: "User is already a member of this group" });
    }
  } catch (error) {
    console.error("Error adding user to group:", error);
    return res.status(500).json({ message: "Error adding user to group" });
  }
});

// Create Channel
router.post("/:groupId/create/channel", async (req, res) => {
  const { name } = req.body.channelData;
  const { userId, userRole } = req.body.userData;
  const { groupId } = req.params;
  if (!name) {
    return res.status(400).json({ message: "Channel name is required." });
  }
  try {
    const db = client.db("chatSystem");
    const dbChannels = db.collection("channels");
    // Ensure proper authorization logic
    if (userRole !== "Super Admin" && group.creatorId !== userId) {
      return res.status(403).json({
        message: "You are not authorized to create channels for this group.",
      });
    }
    const existingChannels = await dbChannels.find({ groupId }).toArray();
    const nextChannelId = existingChannels.length + 1;
    const newChannel = {
      id: [groupId, nextChannelId],
      name: name,
      messages: [],
      createdBy: userId,
      creatorRole: userRole,
      createdOn: new Date(),
    };
    const insertResult = await dbChannels.insertOne(newChannel);
    if (!insertResult.insertedId) {
      return res.status(500).json({ message: "Failed to create channel." });
    }
    return res
      .status(201)
      .json({ message: "Channel created successfully", channel: newChannel });
  } catch (error) {
    console.error("Error creating channel:", error);
    return res.status(500).json({ message: "Error creating channel." });
  }
});

// Delete Channel
router.post("/:groupId/delete/channel", async (req, res) => {
  const { channelData, userData } = req.body;
  const { groupId } = req.params;
  try {
    const db = client.db("chatSystem");
    const channelsCollection = db.collection("channels");
    // Find the channel by groupId and channelId
    const channel = await channelsCollection.findOne({
      "id.0": groupId, // First part of the tuple is groupId
      "id.1": channelData.id[1], // Second part is channelNumber
    });
    if (!channel) {
      return res.status(404).json({ message: "Channel not found." });
    }
    // Authorization check based on user data
    if (
      userData.userRole !== "Super Admin" &&
      channel.createdBy !== userData.userId
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this channel." });
    }
    // Delete the channel from the collection
    const deleteResult = await channelsCollection.deleteOne({
      "id.0": groupId,
      "id.1": channelData.id[1],
    });
    if (deleteResult.deletedCount === 0) {
      return res.status(500).json({ message: "Failed to delete channel." });
    }
    return res.status(200).json({ message: "Channel deleted successfully" });
  } catch (error) {
    console.error("Error deleting channel:", error);
    return res.status(500).json({ message: "Error deleting channel." });
  }
});

// Get Channel Messages
router.get("/:groupId/:channelId/messages", async (req, res) => {
  const { groupId, channelId } = req.params;
  console.log("Group ID:", groupId, "Channel ID:", channelId);
  try {
    const db = client.db("chatSystem");
    const channelsCollection = db.collection("channels");
    // Find the channel by groupId and channelId
    const channel = await channelsCollection.findOne({
      "id.0": groupId, // First part of the tuple is groupId
      "id.1": parseInt(channelId), // Second part is channelNumber
    });
    if (!channel) {
      return res.status(404).json({ message: "Channel not found." });
    }
    // Return the messages of the channel
    res.status(200).json(channel.messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Error fetching messages." });
  }
});

module.exports = router;