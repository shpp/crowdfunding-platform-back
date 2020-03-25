const express = require('express');
const bodyParser = require('body-parser');
const uuidv4 = require('uuid/v4');

const logger = require('./log');
const {sendMail} = require('./mail');
const {projects, transactions} = require('./controllers');
const utils = require('./utils');
const liqpayClient = require('./liqpay_client');

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
    if (req.body.subscribe === undefined || req.body.subscribe === "") {
        utils.sendResponse(res, 400, {error: 'Missing subscription status'});
        return;
    }
    // Validate amount
    if (!utils.isValidAmount(Number(req.body.amount))) {
        utils.sendResponse(res, 400, {error: 'Missing or wrong amount.'});
        return;
    }
    const subscribe = String(req.body.subscribe) === 'true';
    let subscription = {};
    if(subscribe) {
        subscription = {
            "subscribe"             : "1",
            "subscribe_date_start"  :  new Date().toISOString().replace(/T/, ' ').replace(/Z/, '').split('.')[0],
            "subscribe_periodicity" : "month",
        }
    }
    const order_id = uuidv4();
    const button = liqpayClient.cnb_form({
        'action': subscribe ? 'subscribe' : 'pay',
        'amount': req.body.amount,
        'currency': 'UAH',
        'description': 'Благодійний внесок на діяльність організації',
        'order_id': order_id,
        'version': '3',
        'result_url': process.env.FRONTEND_URL,
        'server_url': process.env.SERVER_URL + '/api/v1/transactions/liqpay-confirmation',
        ...subscription
    });

    const emailInfo = req.body.email ? `<p><strong>Email:</strong> <a href="mailto:${req.body.email}">${req.body.email}</a></p>` : '';
    const nameInfo = (req.body.name || req.body.surname) ? `<p><strong>Кто:</strong> ${req.body.name} ${req.body.surname}</p>` : '<p>Имя не указано</p>';
    sendMail(
        `<div>
            <p><b>Человек собирается поддержать Ш++/КОВО на <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></b></p>
            ${emailInfo}
            ${nameInfo}
            <p><strong>Сумма:</strong> ${req.body.amount}${req.body.currency}</p>
            <p><strong>Действие:</strong>${subscribe ? 'Подписка' : 'Разовая оплата'}</p>
            <p><strong>${req.body.newsletter ? 'Просит подписать его на рассылку донаторам' : 'Не указал, что хочет подписаться на рассылку донаторам'}</strong></p>
            <p><strong>ID покупки:</strong>${order_id}</p>
        </div>`
    , undefined, 'Человек собирается поддержать Ш++/КОВО на ' + process.env.FRONTEND_URL);
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
