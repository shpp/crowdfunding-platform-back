const express = require('express');
const bodyParser = require('body-parser');
const uuidv4 = require('uuid/v4');

const logger = require('./log');
const {projects, transactions} = require('./controllers');
const utils = require('./utils');
const liqpayClient = require('../liqpay_client');

// First of all - check environment variables
if (!utils.isValidEnvironment(process.env)) {
    logger.error('Environment variables are not set properly.');
    process.exit(1);
}

// Create Express app instance
let app = express();

app.use(bodyParser.urlencoded({extended: true}));

// Set up logging middleware
app.use(require('./middlewares/log'));

// Set up controllers
app.use('/api/v1/projects', projects);
app.use('/api/v1/transactions', transactions);
app.use('/api/v1/donate', function(req, res) {
    if (req.body.subscribe === undefined) {
        utils.sendResponse(res, 400, {error: 'Missing subscription status'});
        return;
    }
    // Validate amount
    if (!utils.isValidAmount(Number(req.body.amount))) {
        utils.sendResponse(res, 400, {error: 'Missing or wrong amount.'});
        return;
    }
    const button = liqpayClient.cnb_form({
        'action': req.body.subscribe ? 'subscribe' : 'pay',
        'amount': req.body.amount,
        'currency': 'UAH',
        'description': 'Благодійний внесок на діяльність ГО',
        'order_id': uuidv4(),
        'version': '3',
        'server_url': process.env.SERVER_URL + '/api/v1/transactions/liqpay-confirmation'
    });
    utils.sendResponse(res, 200, {button});
});

// Set up static route for images
app.use('/static', express.static(process.env.FILE_STORAGE_PATH || 'uploads'));

// Initialize DB
require('./db').init(process.env.MONGODB_URI + "?authSource=admin&authMechanism=DEFAULT").then(() => {
    logger.info('Successfully connected to the database.');

    // Listen server
    return app.listen(process.env.PORT || 80)
}).then(() => {
    logger.info(`SHPP Crowd-funding backend app running.`)
});
