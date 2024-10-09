const express = require('express');
const router = express.Router();
const { readDataFile, writeDataFile } = require('../utils/fileUtils');

router.post('/banUser', async (req, res) => {
    const { userId, groupId, channelId, currentUserId, currentUserRole } = req.body;
    try {
        const data = await readDataFile();
        const group = data.groups.find(g => g.id === groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        };
        if (currentUserRole !== 'Super Admin' && group.creatorId !== currentUserId) {
            return res.status(403).json({ message: 'You are not authorized to ban users in this group.' });
        };
        group.members = group.members.filter(memberId => memberId !== userId);
        const banReport = {
            id: data.banReports.length + 1,
            bannedUserId: userId,
            bannedByUserId: currentUserId,
            groupId,
            channelId: channelId || null,
            reason: 'Violation of group rules',
            timestamp: new Date().toISOString()
        };
        data.banReports.push(banReport);
        await writeDataFile(data);
        res.status(200).json({ message: 'User banned successfully', banReport });
    } catch (error) {
        console.error('Error banning user:', error);
        res.status(500).json({ message: 'Error banning user' });
    };
});

router.get('/banReports', async (req, res) => {
    const { adminId } = req.query;
    try {
        const data = await readDataFile();
        const admin = data.users.find(u => u.id === parseInt(adminId, 10));

        if (!admin || admin.role !== 'Super Admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        };
        res.status(200).json(data.banReports || []);
    } catch (error) {
        handleError(res, error, 'Error fetching ban reports');
    };
});

module.exports = router;