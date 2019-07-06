const express = require('express');
const logger = require('./log');
// const {projects, transactions} = require('controllers');

// Create Express app instance
let app = express();

// Set up logging middleware
app.use(require('./middlewares/log'));

// Set up controllers
// app.use('api/v1/projects', projects);
// app.use('api/v1/transactions', transactions);

// Initialize DB
require('./db').init(process.env.MONGODB_URI).then(() => {
    logger.info('Successfully connected to the database.');

    // Listen server
    return app.listen(process.env.PORT || 80)
}).then(() => {
    logger.info(`SHPP Crowdfunding backend app running.`)
});
