const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const validate = require("validate.js");

const logger = require('./log');
const validations = require('./validations');
const {projects, transactions, orders} = require('./controllers');

// First of all - check environment variables
const envValidationResult = validate(process.env, validations.env);
if (envValidationResult) {
    logger.error('Invalid environmental variables', {data: envValidationResult});
    process.exit(1);
}

// Create Express app instance
let app = express();

if (process.env.NODE_ENV === 'development') {
    app.use(cors({
        origin: (o, cb) => cb(null, true), //o.startsWith(process.env.FRONTEND_URL) ? cb(null, true) : cb(new Error('Not allowed by CORS')),
        credentials: true
    }));
}
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set up logging middleware
app.use(require('./middlewares/log'));

// Set up controllers
app.use('/api/v1/projects', projects);
app.use('/api/v1/transactions', transactions);
app.use('/api/v1/orders', orders);

// Set up static route for images
app.use('/static', express.static(process.env.FILE_STORAGE_PATH || 'uploads'));

// Initialize DB
require('./db').init(process.env.MONGODB_URI).then(() => {
    logger.info('Successfully connected to the database.');

    // Listen server
    return app.listen(process.env.PORT || 80)
}).then(() => {
    logger.info(`SHPP crowdfunding backend app running.`)
});
