module.exports.isValidProjectId = function (projectId) {
    // Must be a 24-digit hex string
    return typeof projectId == 'string' && /^[0-9A-F]{24}$/i.test(projectId);
};