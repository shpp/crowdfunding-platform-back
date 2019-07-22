const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const uuidv4 = require('uuid/v4');

const Project = require('../models/project');
const Transaction = require('../models/transaction');
const auth = require('../middlewares/auth');

const utils = require('../utils');
const liqpayClient = require('../liqpay_client');

let router = express.Router();
router.use(bodyParser.urlencoded({extended: true}));

const upload = multer({
    storage: process.env.FILE_STORAGE_PATH || 'uploads/',
    fileFilter: utils.multerImageFilter,
    filter: {
        fieldSize: 10000000
    }
});

router.route('/create')
    .post(auth, async function (req, res) {
        // Validate project name
        if (typeof req.body['name'] !== 'string' || req.body['name'].length === 0) {
            res.status(400).send({success: false, error: 'Missing or wrong project name.'});
            return;
        }

        // Create a transaction
        const projectId = await Project.create(req.body['name']);

        // Check DB operation for the error
        if (projectId === null) {
            res.status(500).send({success: false, error: 'Operation can\'t be performed. Please, try again later.'});
            return;
        }

        // Respond with success and transaction ID.
        res.status(200).send({
            success: true,
            project_id: projectId
        });
    });

router.route('/update')
    .post(auth, async function (req, res) {
        // Validate project ID
        if (req.body['id'] === undefined || !utils.isValidProjectId(req.body['id'])) {
            res.status(400).send({success: false, error: 'Missing or wrong project ID.'});
            return;
        }

        // Validate project name
        if (req.body['name'] === undefined || typeof req.body['name'] !== 'string' || req.body['name'].length === 0) {
            res.status(400).send({success: false, error: 'Missing or wrong project name.'});
            return;
        }

        // Validate project description
        if (req.body['description'] === undefined || typeof req.body['description'] !== 'string' || req.body['description'].length === 0) {
            res.status(400).send({success: false, error: 'Missing or wrong project description.'});
            return;
        }

        // Validate planned spendings
        if (req.body['planned_spendings'] === undefined || typeof req.body['planned_spendings'] !== 'string' || req.body['planned_spendings'].length === 0) {
            res.status(400).send({success: false, error: 'Missing or wrong planned spendings.'});
            return;
        }

        // Validate planned spendings
        if (req.body['actual_spendings'] === undefined || typeof req.body['actual_spendings'] !== 'string') {
            res.status(400).send({success: false, error: 'Missing or wrong actual spendings.'});
            return;
        }

        // Validate planned spendings
        if (!utils.isValidAmountString(req.body['amount'])) {
            res.status(400).send({success: false, error: 'Missing or wrong amount.'});
            return;
        }

        // Validate currency
        if (req.body['currency'] !== 'UAH') {
            res.status(400).send({success: false, error: 'Missing or wrong currency.'});
            return;
        }

        // Update a project with new data
        const status = await Project.update(
            req.body['id'],
            req.body['name'],
            req.body['description'],
            req.body['planned_spendings'],
            req.body['actual_spendings'],
            Number(req.body['amount'])
        );

        // Check DB operation for the error
        if (!status) {
            res.status(500).send({success: false, error: 'Operation can\'t be performed. Please, try again later.'});
            return;
        }

        // Respond with success.
        res.status(200).send({
            success: true
        });
    });

router.route('/delete')
    .delete(auth, async function (req, res) {
        // Validate project ID
        if (req.query['id'] === undefined || !utils.isValidProjectId(req.query['id'])) {
            res.status(400).send({success: false, error: 'Missing or wrong project ID.'});
            return;
        }

        // Now we need to verify that this project does not have any transactions. So that, only created accidentally
        // or accidentally created and published project can be deleted. If someone pledged a project - it can't be deleted.
        const transactions = await Transaction.listByProjectId(req.query['id']);

        if (transactions.length > 0) {
            res.status(400).send({
                success: false,
                error: 'Operation can\'t be performed, as this project already has some transactions.'
            });
            return;
        }

        // Delete a project
        const status = await Project.delete(req.query['id']);

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

router.route('/admin-list')
    .get(auth, async function (req, res) {
        let projects = await Project.list();

        // Populate response with funded amount
        projects = await Promise.all(projects.map(async function (project) {
            // Fetch transactions by given project ID
            let transactions = await Transaction.listByProjectId(String(project._id));

            // Count only confirmed transactions
            transactions = transactions.filter(t => t.status === 'confirmed');

            // Update funded amount field
            project.amountFunded = transactions.reduce((sum, t) => sum + t.amount, 0);
            project.completed = project.amountFunded >= project.amount;

            return project;
        }));

        // Respond with success and projects list.
        res.status(200).send({
            success: true,
            projects
        });
    });

router.route('/list')
    .get(async function (req, res) {
        let projects = await Project.list();

        // Filter non-published projects
        projects = projects.filter(p => p.published);

        // Populate response with funded amount
        projects = await Promise.all(projects.map(async function (project) {
            // Fetch transactions by given project ID
            let transactions = await Transaction.listByProjectId(String(project._id));

            // Count only confirmed transactions
            transactions = transactions.filter(t => t.status === 'confirmed');

            // Update funded amount field
            project.amountFunded = transactions.reduce((sum, t) => sum + t.amount, 0);
            project.completed = project.amountFunded >= project.amount;

            return project;
        }));

        // Respond with success and projects list.
        res.status(200).send({
            success: true,
            projects
        });
    });

router.route('/publish')
    .post(auth, async function (req, res) {
        // Validate project ID
        if (req.body['id'] === undefined || !utils.isValidProjectId(req.body['id'])) {
            res.status(400).send({success: false, error: 'Missing or wrong project ID.'});
            return;
        }

        // Publish project
        const status = await Project.publish(req.body['id']);

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

router.route('/upload-image')
    .post(auth, upload.single('image'), async function (req, res) {
        // Respond with success.
        res.status(200).send({
            success: true
        });
    });

router.route('/button')
    .get(async function (req, res) {
        // Validate project ID
        if (req.query['id'] === undefined || !utils.isValidProjectId(req.query['id'])) {
            res.status(400).send({success: false, error: 'Missing or wrong project ID.'});
            return;
        }

        // Obtain a project from DB
        const project = await Project.get(req.query['id']);

        // Check if project with specified ID exist and published
        if (project === null || !project.published) {
            res.status(400).send({success: false, error: 'The project does not exist.'});
            return;
        }

        // Generate LiqPay button
        const button = liqpayClient.cnb_form({
            'action': 'paydonate',
            'amount': '5',
            'currency': 'UAH',
            'description': 'Безповоротна допомога проекту ' + project.name,
            'order_id': req.query['id'] + '-' + uuidv4(),
            'version': '3',
            'server_url': process.env.SERVER_URL + '/api/v1/transactions/liqpay-confirmation'
        });
        res.status(200).send({success: true, button});
    });

module.exports = router;