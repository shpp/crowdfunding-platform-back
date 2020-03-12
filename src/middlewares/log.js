const logger = require('../log');

module.exports = async function (req, res, next) {
    logger.info(`[request] ${req.ip} ${req.method} ${req.path} query:${JSON.stringify(req.query)} body:${JSON.stringify(req.body)}`);

    next();
};
