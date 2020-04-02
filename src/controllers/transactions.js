const express = require('express');

const Project = require('../models/project');
const Transaction = require('../models/transaction');
const auth = require('../middlewares/auth');

const utils = require('../utils');
const liqpayClient = require('../liqpay_client');
const {sendResponse} = utils;

const logger = require('../log');
const {sendMail} = require('../mail');
let router = express.Router();

router.route('/create')
    .post(auth, async function (req, res) {
        // Validate project ID
        if (req.body['project_id'] === undefined || !utils.isValidProjectId(req.body['project_id'])) {
            sendResponse(res, 400, {error: 'Missing or wrong project ID.'});
            return;
        }

        // Check if project with given ID exists.
        let project = await Project.get(req.body['project_id']);
        if (project === null) {
            sendResponse(res, 400, {error: 'Project with given ID can\'t be found.'});
            return;
        }

        // Validate amount
        if (req.body['amount'] === undefined || !utils.isValidAmount(Number(req.body['amount']))) {
            sendResponse(res, 400, {error: 'Missing or wrong amount.'});
            return;
        }

        // Validate donator name
        if (req.body['donator_name'] !== undefined && req.body['donator_name'].length === 0) {
            sendResponse(res, 400, {error: 'Empty donator name.'});
            return;
        }

        // Validate donator phone
        if (req.body['donator_phone'] !== undefined && !utils.isValidPhoneNumber(req.body['donator_phone'])) {
            sendResponse(res, 400, {error: 'Wrong phone number format.'});
            return;
        }

        // Create a transaction
        const transactionId = await Transaction.create(
            req.body['project_id'],
            'manual',
            Number(req.body['amount']),
            req.body['donator_name'],
            req.body['donator_phone']
        );

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
        // Validate transaction ID
        if (req.body['id'] === undefined || !utils.isValidTransactionId(req.body['id'])) {
            sendResponse(res, 400, {error: 'Missing or wrong transaction ID.'});
            return;
        }

        // Revoke transaction
        const status = await Transaction.revoke(req.body['id']);

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
        // Validate transaction ID
        if (req.body['id'] === undefined || !utils.isValidTransactionId(req.body['id'])) {
            sendResponse(res, 400, {error: 'Missing or wrong transaction ID.'});
            return;
        }

        // Reaffirm a transaction
        const status = await Transaction.reaffirm(req.body['id']);

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
        // Validate project ID
        if (req.query['project_id'] !== undefined && !utils.isValidProjectId(req.query['project_id'])) {
            sendResponse(res, 400, {error: 'Wrong project ID.'});
            return;
        }

        let transactions;

        if (req.query['project_id'] !== undefined) {
            transactions = await Transaction.listByProjectId(req.query['project_id']);
        } else {
            transactions = await Transaction.list();
        }

        // Respond with success and transactions list.
        sendResponse(res, 200, {transactions});
    });

router.route('/liqpay-confirmation')
    .post(async function (req, res) {
        // Check data existence
        if (req.body['data'] !== undefined && typeof req.body['data'] !== 'string') {
            sendResponse(res, 400, {error: 'Data is not provided.'});
            return;
        }

        // Check signature existence
        if (req.body['signature'] !== undefined && typeof req.body['signature'] !== 'string') {
            sendResponse(res, 400, {error: 'Signature is not provided.'});
            return;
        }

        // Verify data authority
        if (!liqpayClient.verify(req.body['data'], req.body['signature'])) {
            sendResponse(res, 400, {error: 'Wrong signature.'});
            return;
        }

        // Convert data to JS object
        const data = JSON.parse(Buffer.from(req.body['data'], 'base64').toString());

        logger.info(`Parsed data: ${JSON.stringify(data)}`);
        // Notify about unsuccessful payments
        if (!['success', 'wait_accept', 'subscribed'].includes(data['status'])) {
            sendMail(
                `<div>
                    <p><strong>Произошла ошибка при оплате на <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></strong></p>
                    <p><strong>Телефон:</strong> <a href="tel:${data['sender_phone']}">${data['sender_phone']}</a></p>
                    <p><strong>Описание:</strong>${data.description}</p>
                    <p><strong>Статус:</strong>${data.status} (Ошибка: ${data['err_code']} - ${data['err_description']})</p>
                    <p><strong>Действие:</strong>${data.action}</p>
                    <p><strong>Телефон: </strong><a href="tel:${data['sender_phone']}">${data['sender_phone']}</a></p>
                    <p><strong>Сумма: </strong>${data.amount}${data.currency}</p>
                    <p><strong>ID транзакции: </strong>${data['transaction_id']}</p>
                    <p><strong>ID покупки: </strong>${data['order_id']}</p>
                    <p>Нужно узнать у техподдержки liqpay, в чём причина проблемы.</p>
                </div>`
            , undefined, 'Ошибка при оплате на donate.shpp.me');
            sendResponse(res, 200, {error: 'wrong status: ' + data['status']});
            return;
        }

        // Determine project ID
        const projectId = data['order_id'].split(':')[1] || "shpp-kowo";

        // Create a transaction
        const transactionId = await Transaction.create({
            projectId,
            type: 'liqpay',
            amount: data.amount,
            donatorName: undefined,
            donatorPhone: data['sender_phone'],
            paymentId: String(data['payment_id']),
            status: data['status'],
            subscription: data.action === 'subscribe'
        });

        // Respond with 500 code in case of transaction creation failure.
        if (transactionId === null) {
            sendResponse(res, 500, {error: 'Try again later.'});
            return;
        }

        const actions = {
            subscribe: 'Подписался',
            pay: 'Оплатил одноразово',
            regular: 'Ежемесячное списание денег'
        };
        sendMail(
            `<div>
                <p><b>Новая оплата с <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></b></p>
                <p><strong>Телефон: </strong><a href="tel:${data['sender_phone']}">${data['sender_phone']}</a></p>
                <p><strong>Сумма: </strong>${data.amount}${data.currency}</p>
                <p><strong>Описание: </strong>${data.description}</p>
                <p><strong>Действие: </strong>${actions[data.action] || data.action}</p>
                <p><strong>ID покупки: </strong>${data['order_id']}</p>
            </div>`
        );
        sendResponse(res, 200, {info: "transaction successfully added"});
    });

module.exports = router;
