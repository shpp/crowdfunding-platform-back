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

        // Create a project
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
        if (req.body['_id'] === undefined || !utils.isValidProjectId(req.body['_id'])) {
            res.status(400).send({success: false, error: 'Missing or wrong project ID.'});
            return;
        }

        // Validate project name
        if (req.body['name'] === undefined || typeof req.body['name'] !== 'string' || req.body['name'].length === 0) {
            res.status(400).send({success: false, error: 'Missing or wrong project name.'});
            return;
        }

        // Validate project state
        if (req.body['state'] === undefined ||
            typeof req.body['state'] !== 'string' ||
            !(['unpublished', 'published', 'archived'].includes(req.body['state']))
        ) {
            res.status(400).send({success: false, error: 'Missing or wrong project state. State must be one of the following: [\'unpublished\', \'published\', \'archived\']'});
            return;
        }

        // Validate project description
        if (req.body['description'] === undefined || typeof req.body['description'] !== 'string' || req.body['description'].length === 0) {
            res.status(400).send({success: false, error: 'Missing or wrong project description.'});
            return;
        }

        // Validate project's short description
        if (req.body['shortDescription'] === undefined || typeof req.body['shortDescription'] !== 'string' || req.body['shortDescription'].length === 0) {
            res.status(400).send({success: false, error: 'Missing or wrong project short description.'});
            return;
        }

        // Validate planned spendings
        if (req.body['plannedSpendings'] === undefined || typeof req.body['plannedSpendings'] !== 'string' || req.body['plannedSpendings'].length === 0) {
            res.status(400).send({success: false, error: 'Missing or wrong planned spendings.'});
            return;
        }

        // Validate actual spendings
        if (req.body['actualSpendings'] === undefined || typeof req.body['actualSpendings'] !== 'string') {
            res.status(400).send({success: false, error: 'Missing or wrong actual spendings.'});
            return;
        }

        // Validate cover image
        if (!utils.isValidUrl(req.body['image'])) {
            res.status(400).send({success: false, error: 'Missing or wrong cover image.'});
            return;
        }

        // Validate amount
        if (!utils.isValidAmount(Number(req.body['amount']))) {
            res.status(400).send({success: false, error: 'Missing or wrong amount.'});
            return;
        }

        // Validate creation time
        if (!utils.isValidTimestamp(Number(req.body['createdAtTS']))) {
            res.status(400).send({success: false, error: 'Missing or wrong creation time.'});
            return;
        }

        // Validate currency
        if (req.body['currency'] !== 'UAH') {
            res.status(400).send({success: false, error: 'Missing or wrong currency.'});
            return;
        }

        // Update a project with new data
        const status = await Project.update(req.body);

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

router.route('/admin-list')
    .get(auth, async function (req, res) {
        let projects = await Project.list();

        // Populate response with funded amount
        projects = await Promise.all(projects.map(async function (project) {
            // Fetch transactions by given project ID
            let transactions = await Transaction.listByProjectId(String(project._id));

            // Count only confirmed transactions
            transactions = transactions.filter(t => t.status === 'confirmed');

            // Add dynamically calculated properties
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

        // Select only published projects
        projects = projects.filter(p => p.state === 'published');

        // Populate response with funded amount
        projects = await Promise.all(projects.map(async function (project) {
            // Fetch transactions by given project ID
            let transactions = await Transaction.listByProjectId(String(project._id));

            // Count only confirmed transactions
            transactions = transactions.filter(t => t.status === 'confirmed');

            // Add dynamically calculated properties
            project.bakers = transactions.length;
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
        if (project === null || project.state !== 'published') {
            res.status(400).send({success: false, error: 'The project does not exist.'});
            return;
        }

        // Generate LiqPay button
        const button = liqpayClient.cnb_form({
            'action': 'paydonate',
            'amount': '300',
            'currency': 'UAH',
            'description': 'Безповоротна допомога проекту "' + project.name + '"',
            'order_id': req.query['id'] + '-' + uuidv4(),
            'version': '3',
            'server_url': process.env.SERVER_URL + '/api/v1/transactions/liqpay-confirmation'
        });
        res.status(200).send({success: true, button});
    });

module.exports = router;
