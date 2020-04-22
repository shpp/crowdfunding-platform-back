const logger = require('winston');
const {timestamp, combine, printf} = logger.format;

// Application logs format function
const logFormat = printf(({timestamp, level, message, data}) => {
    return `${timestamp} ${level.toUpperCase()}: ${message} ${data ? JSON.stringify(data) : ''}`;
});

// Configure logger
logger.configure({
    transports: [
        new logger.transports.Console,
        // new logger.transports.File({filename: 'shpp-crowd-funding-backend.log'})
    ],
    format: combine(
        timestamp(),
        logFormat
    )
});
logger.level = 'debug';

module.exports = logger;
