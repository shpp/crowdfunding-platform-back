const logger = require('../log');

module.exports = async function (req, res, next) {
    logger.info(`[request] ${req.ip} ${req.method} ${req.path}`);

    next();
};