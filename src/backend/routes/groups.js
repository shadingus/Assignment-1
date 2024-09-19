const express = require('express');
const router = express.Router();
const { readDataFile, writeDataFile } = require('../utils/fileUtils');
const { isUserAuthorizedForGroup } = require('../utils/authUtils');

const findGroupById = (groupId, data) => {
    return data.groups.find(group => group.id === parseInt(groupId));
};

const deleteGroup = async (groupId) => {
    const data = await readDataFile();
    const groupIndex = data.groups.findIndex(group => group.id === parseInt(groupId));
    if (groupIndex !== -1) {
        data.groups.splice(groupIndex, 1); // Remove group
        await writeDataFile(data); // Save the updated data
    };
};

const deleteChannel = async (groupId, channelId) => {
    const data = await readDataFile();
    const group = findGroupById(groupId, data);
    if (group) {
        const channelIndex = group.channels.findIndex(channel => channel.id === parseInt(channelId));
        if (channelIndex !== -1) {
            group.channels.splice(channelIndex, 1); // Remove channel
            await writeDataFile(data); // Save the updated data
        };
    };
};

// Create Group
router.post('/', async (req, res) => {
    const { name, members, creatorId } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Group name is required.' });
    };
    try {
        const data = await readDataFile();
        const newGroup = {
            id: data.groups.length + 1,
            name,
            channels: [{ id: 1, name: 'general', messages: [] }],
            members: members || [],
            creatorId,
        };
        data.groups.push(newGroup);
        await writeDataFile(data);
        res.status(201).json({ message: 'Group created successfully', group: newGroup });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ message: 'Error creating group.' });
    };
});

// Get Group
router.get('/:groupId', async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const userId = parseInt(req.query.userId);
    const userRole = req.query.userRole;
    try {
        const data = await readDataFile();
        const group = data.groups.find(g => g.id === groupId);

        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        };

        if (userRole === 'Super Admin' || group.members.includes(userId)) {
            return res.status(200).json(group);
        } else {
            return res.status(403).json({ message: 'You do not have access to this group.' });
        };
    } catch (error) {
        res.status(500).json({ message: 'Error fetching group data.' });
    };
});

// Create Channel
router.post('/:groupId/channels', async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const { userId, userRole, name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Channel name is required.' });
    };

    try {
        const data = await readDataFile();
        const group = data.groups.find(g => g.id === groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        };

        // Ensure proper authorization logic
        if (userRole !== 'Super Admin' && group.creatorId !== userId) {
            return res.status(403).json({ message: 'You are not authorized to create channels for this group.' });
        };

        const newChannel = { id: group.channels.length + 1, name, messages: [] };
        group.channels.push(newChannel);
        await writeDataFile(data);

        return res.status(201).json({ message: 'Channel created successfully', channel: newChannel });
    } catch (error) {
        console.error('Error creating channel:', error);
        return res.status(500).json({ message: 'Error creating channel.' });
    };
});

// Get Channel Messages
router.get('/:groupId/channels/:channelId/messages', async (req, res) => {
    const { groupId, channelId } = req.params;
    try {
        const data = await readDataFile();
        const group = data.groups.find(g => g.id === parseInt(groupId));
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        };
        const channel = group.channels.find(c => c.id === parseInt(channelId));
        if (!channel) {
            return res.status(404).json({ message: 'Channel not found.' });
        };
        res.status(200).json(channel.messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
    };
});

// Delete Group
router.delete('/:groupId', async (req, res) => {
    const groupId = req.params.groupId;
    const { currentUserId, currentUserRole } = req.body; // Extract both currentUserId and currentUserRole
    console.log('Attempting to delete group:', { groupId, currentUserId, currentUserRole });
    try {
        const data = await readDataFile();
        const group = findGroupById(groupId, data);
        // Allow Super Admin or the group creator to delete the group
        if (group && (group.creatorId === currentUserId || currentUserRole === 'Super Admin')) {
            await deleteGroup(groupId);
            return res.status(200).json({ message: 'Group deleted successfully' });
        } else {
            return res.status(403).json({ message: 'You do not have permission to delete this group' });
        };
    } catch (error) {
        console.error('Error deleting group:', error);
        return res.status(500).json({ message: 'Error deleting group.' });
    };
});

// Delete Channel
router.delete('/:groupId/channels/:channelId', async (req, res) => {
    const { groupId, channelId } = req.params;
    const { currentUserId, currentUserRole } = req.body;
    console.log('Attempting to delete channel:', { groupId, channelId, currentUserId, currentUserRole });
    try {
        const data = await readDataFile();
        const group = findGroupById(groupId, data);
        if (!group) {
            console.log('Group not found');
            return res.status(404).json({ message: 'Group not found.' });
        };
        if (currentUserRole === 'Super Admin' || group.creatorId === currentUserId) {
            await deleteChannel(groupId, channelId);
            console.log('Channel deleted successfully');
            return res.status(200).json({ message: 'Channel deleted successfully' });
        } else {
            console.log('Permission denied');
            return res.status(403).json({ message: 'You do not have permission to delete this channel' });
        };
    } catch (error) {
        console.error('Error deleting channel:', error);
        return res.status(500).json({ message: 'Error deleting channel.' });
    };
});

// Add User to Group
router.post('/addUserToGroup', async (req, res) => {
    const { userId, groupId, creatorId, currentUserRole } = req.body;
    // Ensure userId and groupId are treated as numbers in the backend
    const parsedUserId = Number(userId);
    const parsedGroupId = Number(groupId);
    try {
        const data = await readDataFile();
        const group = data.groups.find(g => g.id === parsedGroupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        };
        if (currentUserRole !== 'Super Admin' && group.creatorId !== creatorId) {
            return res.status(403).json({ message: 'You are not authorized to add users to this group.' });
        };
        if (!group.members.includes(parsedUserId)) {
            group.members.push(parsedUserId); // Add the user to the group
            await writeDataFile(data); // Save updated group data
            res.status(200).json({ message: 'User added to the group successfully' });
        } else {
            res.status(400).json({ message: 'User is already a member of this group' });
        };
    } catch (error) {
        console.error('Error adding user to group:', error);
        res.status(500).json({ message: 'Error adding user to group' });
    };
});

// Assuming you have a route for sending messages in your Express app
router.post('/send-message', async (req, res) => {
    const { groupId, channelId, username, message } = req.body;
    try {
        const data = await readDataFile();
        const group = findGroupById(groupId, data);
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }
        const channel = group.channels.find(c => c.id === channelId);
        if (!channel) {
            return res.status(404).json({ message: 'Channel not found.' });
        }
        channel.messages.push({ username, message });
        await writeDataFile(data);
        res.status(200).json({ message: 'Message sent successfully.' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Error sending message.' });
    }
});

module.exports = router;