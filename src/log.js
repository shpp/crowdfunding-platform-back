const logger = require('winston');
const {timestamp, combine, printf} = logger.format;

// Application logs format function
const logFormat = printf(info => {
    return `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`;
});

// Configure logger
logger.configure({
    transports: [
        new logger.transports.Console,
        // new logger.transports.File({filename: 'taxifinder.log'})
    ],
    format: combine(
        timestamp(),
        logFormat
    )
});
logger.level = 'debug';

module.exports = logger;