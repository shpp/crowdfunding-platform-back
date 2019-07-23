const express = require('express');
const logger = require('./log');
const {projects, transactions} = require('./controllers');
const utils = require('./utils');

// First of all - check environment variables
if (!utils.isValidEnvironment(process.env)) {
    logger.error('Environment variables are not set properly.');
    process.exit(1);
}

// Create Express app instance
let app = express();

// Set up logging middleware
app.use(require('./middlewares/log'));

// Set up controllers
app.use('/api/v1/projects', projects);
app.use('/api/v1/transactions', transactions);

// Set up static route for images
app.use('/static', express.static(process.env.FILE_STORAGE_PATH || 'uploads'));

// Initialize DB
require('./db').init(process.env.MONGODB_URI).then(() => {
    logger.info('Successfully connected to the database.');

    // Listen server
    return app.listen(process.env.PORT || 80)
}).then(() => {
    logger.info(`SHPP Crowd-funding backend app running.`)
});
