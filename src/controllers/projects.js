const express = require('express');
const multer = require('multer');
const uuidv4 = require('uuid/v4');

const Project = require('../models/project');
const Order = require('../models/order');
const Transaction = require('../models/transaction');
const auth = require('../middlewares/auth');
const validation = require('../middlewares/validation');

const logger = require('../log');
const utils = require('../utils');
const liqpayClient = require('../liqpay_client');
const {sendMail} = require("../mail");

const {sendResponse} = utils;

let router = express.Router();

const upload = multer({
    storage: process.env.FILE_STORAGE_PATH || 'uploads/',
    fileFilter: utils.multerImageFilter,
    filter: {
        fieldSize: 10000000
    }
});
router.use(validation);

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
        .filter(t => t.status === 'success');

    const amount_funded = transactions.reduce((sum, t) => sum + (Math.floor(t.amount) || 0), 0);
    const this_month_funded = transactions
        .filter(({created_at}) => {
            const transactionDate = new Date(created_at);
            const now = new Date();
            return transactionDate.getFullYear() === now.getFullYear() && transactionDate.getMonth() === now.getMonth()
        })
        .reduce((sum, t) => sum + (Math.floor(t.amount) || 0), 0);

    return {
        ...project,
        // Add dynamically calculated properties
        amount_funded,
        this_month_funded,
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
        projects = projects.filter(p => p.state !== 'archived');

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

/*
 * req.query includes:
 *
 * @param project_id - string mongo id of project
 * @param language - uk | en
 * @param phone - donator phone
 */
router.route('/donate-step-1')
  .get(async function (req, res) {
    // Obtain a project from DB
    const project = await Project.get(req.query['project_id']);

    // Check if project with specified ID exist and published
    if (project === null || project.state !== 'published') {
      sendResponse(res, 400, {error: 'The project does not exist.'});
      return;
    }

    const currency = req.query.language === 'uk' ? 'UAH' : 'EUR';
    const amount = currency === 'EUR' ? 20 : 300;

    // save this order to DB
    const order_id_from_db = await Order.create({
      ...req.query,
      amount,
      currency,
      subscribe: false,
      status: 'step-1'
    });
    const order_id = order_id_from_db + ':' + req.query['project_id'];

    const descriptions = {
      uk: 'Безповоротна допомога проекту "' + project[`name_${req.query.language}`] + '"',
      en: 'Donation to the project "' + project[`name_${req.query.language}`] + '"'
    };

    // TODO: add email notifications for admins
    const mailData = {
      ...req.query,
      order_id,
      description: descriptions[req.query.language || 'uk'],
      site_url: process.env.FRONTEND_URL
    };
    sendMail('admin/donate.project.step1', mailData, 'Этап 1: Человек собирается поддержать проект на ' + process.env.FRONTEND_URL);

    // Generate LiqPay button
    const cnb_object = liqpayClient.cnb_object({
      order_id,
      amount,
      currency,
      action: 'paydonate',
      // different amount per currency. default is UAH
      language: req.query.language || 'uk',
      description: descriptions[req.query.language || 'uk'],
      version: '3',
      result_url: process.env.FRONTEND_URL + '/project/' + req.query['project_id'],
      server_url: process.env.SERVER_URL + '/api/v1/transactions/liqpay-confirmation'
    });
    sendResponse(res, 200, cnb_object);
  });

/*
 * req.body data includes:
 *
 * @param ...parsed liqpay response - https://www.liqpay.ua/documentation/api/callback,
 * @param project_id,
 * @param UAH_amount - despite the currency, amount of donation in UAH,
 * @param _notify - boolean, hack for frontend, not used in backend
 *
 */
router.route('/donate-step-2')
  .post(async function (req, res) {
    // Obtain a project from DB
    const project = await Project.get(req.body['project_id']);

    // Check if project with specified ID exist and published
    if (project === null || project.state !== 'published') {
      sendResponse(res, 400, {error: 'The project does not exist.'});
      return;
    }

    const mailData = {
      ...req.body,
      UAH_amount: req.body.currency !== 'UAH' && req.body.UAH_amount,
      site_url: process.env.FRONTEND_URL,
    };

    // notify admin
    sendMail('admin/donate.project.step2', mailData, 'Этап 2: Человек ввёл свои реквизиты на ' + process.env.FRONTEND_URL);

    sendResponse(res, 200);
  });

// legacy, not using anymore, we use donate-step-1 instead
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
            uk: 'Безповоротна допомога проекту "' + project[`name_${req.query.language}`] + '"',
            en: 'Donation to the project "' + project[`name_${req.query.language}`] + '"'
        };

        // Generate LiqPay button
        const button = liqpayClient.cnb_form({
            action: 'paydonate',
            // different amount per currency. default is UAH
            amount: req.query.currency === 'EUR' ? '20' : '300',
            currency: req.query.currency || 'UAH',
            language: req.query.language || 'uk',
            description: descriptions[req.query.language || 'uk'],
            order_id: uuidv4() + ':' + req.query['id'],
            version: '3',
            result_url: process.env.FRONTEND_URL + '/project/' + req.query['id'],
            server_url: process.env.SERVER_URL + '/api/v1/transactions/liqpay-confirmation'
        });
        sendResponse(res, 200, {button});
    });

module.exports = router;
