const express = require('express');
const multer = require('multer');
const uuidv4 = require('uuid/v4');

const Project = require('../models/project');
const Transaction = require('../models/transaction');
const auth = require('../middlewares/auth');
const validation = require('../middlewares/validation');

const logger = require('../log');

const utils = require('../utils');
const liqpayClient = require('../liqpay_client');
const {sendResponse} = utils;

let router = express.Router();

const upload = multer({
    storage: process.env.FILE_STORAGE_PATH || 'uploads/',
    fileFilter: utils.multerImageFilter,
    filter: {
        fieldSize: 10000000
    }
});

router.route('/create')
    .post(auth, async function (req, res) {
        // Create a project
        const project_id = await Project.create(req.body);

        // Check DB operation for the error
        if (project_id === null) {
            sendResponse(res, 500, {error: 'Operation can\'t be performed. Please, try again later.'});
            return;
        }

        // Respond with success and transaction ID.
        sendResponse(res, 200, {project_id});
    });

router.route('/update')
    .post(auth, async function (req, res) {
        // Update a project with new data
        const status = await Project.update(req.body);

        // Check DB operation for the error
        if (!status) {
            sendResponse(res, 500, {error: 'Operation can\'t be performed. Please, try again later.'});
            return;
        }

        // Respond with success.
        sendResponse(res, 200);
    });

async function sumTransactions(project) {
    // Fetch transactions by given project ID
    const transactions = (await Transaction.listByProjectId(project._id))
        // Count only confirmed transactions
        .filter(t => t.status === 'confirmed');

    const amount_funded = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    return {
        ...project,
        // Add dynamically calculated properties
        amount_funded,
        completed: amount_funded >= project.amount
    };
}

router.route('/admin-list')
    .get(auth, async function (req, res) {
        let projects = await Project.list();

        // Populate response with funded amount
        projects = await Promise.all(projects.map(sumTransactions));

        // Respond with success and projects list.
        sendResponse(res, 200, {projects});
    });

router.route('/list')
    .get(async function (req, res) {
        let projects = await Project.list();

        // Select only published projects
        projects = projects.filter(p => p.state === 'published');

        // Populate response with funded amount
        projects = await Promise.all(projects.map(sumTransactions));

        // Respond with success and projects list.
        sendResponse(res, 200, {projects});
    });

router.route('/upload-image')
    .post(auth, upload.single('image'), async function (req, res) {
        // Respond with success.
        sendResponse(res, 200);
    });

router.route('/button')
    .get(async function (req, res) {
        // Obtain a project from DB
        const project = await Project.get(req.query['id']);

        // Check if project with specified ID exist and published
        if (project === null || project.state !== 'published') {
            sendResponse(res, 400, {error: 'The project does not exist.'});
            return;
        }

        const descriptions = {
            uk: 'Безповоротна допомога проекту "' + project.name + '"',
            en: 'Donation to the project "' + project.name + '"'
        };

        // Generate LiqPay button
        const button = liqpayClient.cnb_form({
            'action': 'paydonate',
            // different amount per currency. default is UAH
            'amount': req.query.currency === 'EUR' ? '20' : '300',
            'currency': req.query.currency || 'UAH',
            'language': req.query.language || 'uk',
            'description': descriptions[req.body.language || 'uk'],
            'order_id': uuidv4() + ':' + req.query['id'],
            'version': '3',
            'result_url': process.env.FRONTEND_URL + '/project/' + req.query['id'],
            'server_url': process.env.SERVER_URL + '/api/v1/transactions/liqpay-confirmation'
        });
        sendResponse(res, 200, {button});
    });

module.exports = router;
