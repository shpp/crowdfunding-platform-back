const express = require('express');
const bodyParser = require('body-parser');

const Project = require('../models/project');
const Transaction = require('../models/transaction');
const auth = require('../middlewares/auth');

const utils = require('../utils');
const liqpayClient = require('../liqpay_client');

let router = express.Router();
router.use(bodyParser.urlencoded({extended: true}));

router.route('/create')
    .post(auth, async function (req, res) {
        // Validate project ID
        if (req.body['project_id'] === undefined || !utils.isValidProjectId(req.body['project_id'])) {
            res.status(400).send({success: false, error: 'Missing or wrong project ID.'});
            return;
        }

        // Check if project with given ID exists.
        let project = await Project.get(req.body['project_id']);
        if (project === null) {
            res.status(400).send({success: false, error: 'Project with given ID can\'t be found.'});
            return;
        }

        // Validate amount
        if (req.body['amount'] === undefined || !utils.isValidAmount(Number(req.body['amount']))) {
            res.status(400).send({success: false, error: 'Missing or wrong amount.'});
            return;
        }

        // Validate donator name
        if (req.body['donator_name'] !== undefined && req.body['donator_name'].length === 0) {
            res.status(400).send({success: false, error: 'Empty donator name.'});
            return;
        }

        // Validate donator phone
        if (req.body['donator_phone'] !== undefined && !utils.isValidPhoneNumber(req.body['donator_phone'])) {
            res.status(400).send({success: false, error: 'Wrong phone number format.'});
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
            res.status(500).send({success: false, error: 'Operation can\'t be performed. Please, try again later.'});
            return;
        }

        // Respond with success and transaction ID.
        res.status(200).send({
            success: true,
            transaction_id: transactionId
        });
    });

router.route('/revoke')
    .post(auth, async function (req, res) {
        // Validate transaction ID
        if (req.body['id'] === undefined || !utils.isValidTransactionId(req.body['id'])) {
            res.status(400).send({success: false, error: 'Missing or wrong transaction ID.'});
            return;
        }

        // Revoke transaction
        const status = await Transaction.revoke(req.body['id']);

        // Check DB operation for the error
        if (!status) {
            res.status(500).send({success: false, error: 'Operation can\'t be performed. Please, try again later.'});
            return;
        }

        // Respond with success and transaction ID.
        res.status(200).send({
            success: true
        });
    });

router.route('/reaffirm')
    .post(auth, async function (req, res) {
        // Validate transaction ID
        if (req.body['id'] === undefined || !utils.isValidTransactionId(req.body['id'])) {
            res.status(400).send({success: false, error: 'Missing or wrong transaction ID.'});
            return;
        }

        // Reaffirm a transaction
        const status = await Transaction.reaffirm(req.body['id']);

        // Check DB operation for the error
        if (!status) {
            res.status(500).send({success: false, error: 'Operation can\'t be performed. Please, try again later.'});
            return;
        }

        // Respond with success and transaction ID.
        res.status(200).send({
            success: true
        });
    });

router.route('/list')
    .get(auth, async function (req, res) {
        // Validate project ID
        if (req.query['project_id'] !== undefined && !utils.isValidProjectId(req.query['project_id'])) {
            res.status(400).send({success: false, error: 'Wrong project ID.'});
            return;
        }

        let transactions;

        if (req.query['project_id'] !== undefined) {
            transactions = await Transaction.listByProjectId(req.query['project_id']);
        } else {
            transactions = await Transaction.list();
        }

        // Respond with success and transactions list.
        res.status(200).send({
            success: true,
            transactions
        });
    });

router.route('/liqpay-confirmation')
    .post(async function (req, res) {
        // Check data existence
        if (req.body['data'] !== undefined && typeof req.body['data'] !== 'string') {
            res.status(400).send({success: false, error: 'Data is not provided.'});
            return;
        }

        // Check signature existence
        if (req.body['signature'] !== undefined && typeof req.body['signature'] !== 'string') {
            res.status(400).send({success: false, error: 'Signature is not provided.'});
            return;
        }

        // Verify data authority
        if (!liqpayClient.verify(req.body['data'], req.body['signature'])) {
            res.status(400).send({success: false, error: 'Wrong signature.'});
            return;
        }

        // Convert data to JS object
        const data = JSON.parse(Buffer.from(req.body['data'], 'base64').toString());

        // Skip unsuccessful payments
        if (data['status'] !== 'success') {
            res.sendStatus(200);
            return;
        }

        // Determine project ID
        const projectId = data['order_id'].split('-')[0];

        // Create a transaction
        const transactionId = await Transaction.create(projectId, 'liqpay', data.amount, undefined, undefined, String(data['payment_id']));

        // Respond with 500 code in case of transaction creation failure.
        if (transactionId === null) {
            res.status(500).send({success: false, error: 'Try again later.'});
            return;
        }

        res.sendStatus(200);
    });

module.exports = router;