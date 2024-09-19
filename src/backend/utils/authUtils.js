function isUserAuthorizedForGroup(currentUserRole, group, currentUserId) {
    return currentUserRole === 'Super Admin' || group.creatorId === currentUserId;
};

module.exports = { isUserAuthorizedForGroup };  