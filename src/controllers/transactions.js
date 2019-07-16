const express = require('express');
const bodyParser = require('body-parser');

const Project = require('../models/project');
const Transaction = require('../models/transaction');
const auth = require('../middlewares/auth');

const utils = require('../utils');

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
        if (req.body['amount'] === undefined || !utils.isValidAmountString(req.body['amount'])) {
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
        const transactionId = await Transaction.create(req.body['project_id'], 'manual', req.body['amount'], req.body['donator_name'], req.body['donator_phone']);

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
        if (req.body['transaction_id'] === undefined || !utils.isValidTransactionId(req.body['transaction_id'])) {
            res.status(400).send({success: false, error: 'Missing or wrong transaction ID.'});
            return;
        }

        // Revoke transaction
        const status = await Transaction.revoke(req.body['transaction_id']);

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
        if (req.body['transaction_id'] === undefined || !utils.isValidTransactionId(req.body['transaction_id'])) {
            res.status(400).send({success: false, error: 'Missing or wrong transaction ID.'});
            return;
        }

        // Reaffirm a transaction
        const status = await Transaction.reaffirm(req.body['transaction_id']);

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
        console.log(typeof req.query.data);
        console.log(req.query.data);
        console.log(req.query.signature);

        console.log(typeof req.body.data);
        console.log(req.body.data);
        console.log(req.body.signature);

        res.sendStatus(200);
    });

module.exports = router;