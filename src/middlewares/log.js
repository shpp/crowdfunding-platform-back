const logger = require('../log');

module.exports = async function (req, res, next) {
    logger.info(`[request] ${req.ip} ${req.method} ${req.path} ${JSON.stringify(req.body)}`);

    next();
};
