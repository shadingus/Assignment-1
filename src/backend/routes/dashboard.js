const express = require("express");
const router = express.Router();
const { readDataFile } = require("../utils/fileUtils");

// Dashboard Data Route
router.get("/dashboard-data", async (req, res) => {
  try {
    // Read the data from JSON (users and groups)
    const data = await readDataFile();
    const users = data.users;
    const groups = data.groups;
    // Connect to MongoDB to get channels and chat history
    const db = client.db("chatSystem");
    const channelsCollection = db.collection("channels");
    // Create an array to store channels for each group
    const groupsWithChannels = await Promise.all(
      groups.map(async (group) => {
        // Fetch all channels for this group from MongoDB
        const channels = await channelsCollection
          .find({ "id.0": group.id })
          .toArray();
        return {
          ...group,
          channels, // Attach the channels to the group
        };
      })
    );
    // Return the users, groups (with channels), and chat history
    res.status(200).json({
      users,
      groups: groupsWithChannels, // Send back groups with channels
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Error fetching dashboard data." });
  }
});

module.exports = router;
