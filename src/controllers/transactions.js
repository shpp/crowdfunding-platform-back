const express = require('express');

const Project = require('../models/project');
const Transaction = require('../models/transaction');
const Order = require('../models/order');

const auth = require('../middlewares/auth');
const validation = require('../middlewares/validation');

const utils = require('../utils');
const liqpayClient = require('../liqpay_client');
const {sendResponse} = utils;

const logger = require('../log');
const {stringifyField} = require("../utils");
const {sendMail} = require('../mail');
let router = express.Router();

router.use(validation);

router.route('/create')
    .post(auth, async function (req, res) {
        // Check if project with given ID exists.
        let project = await Project.get(req.body.project_id);
        if (project === null) {
            sendResponse(res, 400, {error: 'Project with given ID can\'t be found.'});
            return;
        }

        // Create a transaction
        const transactionId = await Transaction.create({
            ...req.body,
            status: 'success'
        });

        // Check DB operation for the error
        if (transactionId === null) {
            sendResponse(res, 500, {error: 'Operation can\'t be performed. Please, try again later.'});
            return;
        }

        // Respond with success and transaction ID.
        sendResponse(res, 200, {transaction_id: transactionId});
    });

router.route('/revoke')
    .post(auth, async function (req, res) {
        // Revoke transaction
        const status = await Transaction.revoke(req.body);

        // Check DB operation for the error
        if (!status) {
            sendResponse(res, 500, {error: 'Operation can\'t be performed. Please, try again later.'});
            return;
        }

        // Respond with success and transaction ID.
        sendResponse(res, 200);
    });

router.route('/reaffirm')
    .post(auth, async function (req, res) {
        // Reaffirm a transaction
        const status = await Transaction.reaffirm(req.body);

        // Check DB operation for the error
        if (!status) {
            sendResponse(res, 500, {error: 'Operation can\'t be performed. Please, try again later.'});
            return;
        }

        // Respond with success and transaction ID.
        sendResponse(res, 200);
    });

router.route('/list')
    .get(auth, async function (req, res) {
        let transactions;

        if (req.query.project_id !== undefined) {
            transactions = await Transaction.listByProjectId(req.query.project_id);
        } else {
            transactions = await Transaction.list();
        }

        // Respond with success and transactions list.
        sendResponse(res, 200, {transactions});
    });

router.route('/liqpay-confirmation')
    .post(async function (req, res) {
        // Verify data authority
        if (!liqpayClient.verify(req.body.data, req.body.signature)) {
            sendResponse(res, 400, {error: 'Wrong signature.'});
            return;
        }

        // Convert data to JS object
        const data = JSON.parse(Buffer.from(req.body.data, 'base64').toString());

        logger.info(`Parsed data: ${JSON.stringify(data)}`);

        const actions = {
            subscribe: 'Подписался',
            pay: 'Оплатил одноразово',
            regular: 'Ежемесячное списание денег'
        };

        const order = await Order.get(data.order_id) || {};
        const emailVars = {
            ...data,
            user: !!(order.donator_name || order.donator_surname || data.sender_first_name || data.sender_last_name),
            name: order.donator_name || data.sender_first_name || 'неизвестно',
            surname: order.donator_surname || data.sender_last_name  || 'неизвестно' ,
            email: order.donator_email,
            action: actions[data.action] || data.action,
            site_url: process.env.FRONTEND_URL
        };

        // Notify about unsuccessful payments
        if (!['success', 'wait_accept', 'subscribed'].includes(data.status)) {
            sendMail('admin/donate.step3.error', emailVars, 'Ошибка! Этап 3 оплаты на ' + process.env.FRONTEND_URL);
            sendResponse(res, 200, {error: 'wrong status: ' + data.status});
            return;
        }

        // Determine project ID
        const project_id = data.order_id.split(':')[1] || (await Project.find({slug: 'shpp-kowo'}))._id;

        // Create a transaction
        const transactionId = await Transaction.create({
            project_id,
            type: 'liqpay',
            amount: data.amount_debit,
            donator_name: order.donator_name || data.sender_first_name,
            donator_email: order.donator_email,
            donator_surname: order.donator_surname || data.sender_last_name,
            donator_phone: data.sender_phone,
            payment_id: String(data.payment_id),
            status: data.status,
            order_id: order._id,
            subscription: data.action === 'subscribe',
            action: data.action
        });

        // Respond with 500 code in case of transaction creation failure.
        if (transactionId === null) {
            sendResponse(res, 500, {error: 'Try again later.'});
            return;
        }

        if (JSON.stringify(order) !== '{}') {
            sendMail('admin/donate.step3', emailVars, 'Этап 3: Поступила оплата на ' + process.env.FRONTEND_URL);
            // add transaction to order
            await Order.update({
                ...data,
                id: data.order_id,
                transaction_id: transactionId,
                status: data.action === 'pay' ? 'success' : 'subscribed' // 'step-3'
            });
        } else {
            sendMail('admin/donate.project', emailVars, 'Человек поддержал проект на ' + process.env.FRONTEND_URL);
        }
        sendResponse(res, 200, {info: "transaction successfully added"});
    });

module.exports = router;
