const express = require('express');

const liqpayClient = require('../liqpay_client');
const {sendMail} = require('../mail');
const validation = require('../middlewares/validation');
const {sendResponse} = require('../utils');

const Order = require('../models/order');

let router = express.Router();

router.use(validation);

router.post('/:project_id/donate', async function(req, res) {
    let subscription = {};
    if(req.body.subscribe) {
        subscription = {
            subscribe             : '1',
            subscribe_date_start  :  new Date().toISOString().replace(/T/, ' ').replace(/Z/, '').split('.')[0],
            subscribe_periodicity : 'month',
        }
    }
    const descriptions = {
        uk: 'Благодійний внесок на діяльність організації',
        en: 'Donation for the organisation\'s livelihood'
    };

    // save this order to DB
    const order_id = await Order.create({
        ...req.body,
        status: 'step-1'
    });
    const {language = 'uk'} = req.body;
    const cnb_object = liqpayClient.cnb_object({
        ...subscription,
        order_id,
        language,
        version: '3',
        action: req.body.subscribe ? 'subscribe' : 'pay',
        amount: req.body.amount,
        currency: req.body.currency || 'UAH',

        description: descriptions[language],
        result_url: process.env.FRONTEND_URL,
        server_url: process.env.SERVER_URL + '/api/v1/transactions/liqpay-confirmation',
    });


    const mailData = {
        ...req.body,
        order_id,
        user: !!(req.body.name || req.body.surname),
        site_url: process.env.FRONTEND_URL
    };
    sendMail('admin/donate.step1', mailData, 'Этап 1: Человек собирается поддержать Ш++/КОВО на ' + process.env.FRONTEND_URL);
    sendResponse(res, 200, cnb_object);
});

router.post('/:project_id/donated', async function(req, res) {
    // save this event to DB
    const order = await Order.update({
        ...req.body,
    });

    // Check DB operation for the error
    if (!order) {
        sendResponse(res, 500, {error: 'Operation can\'t be performed. Please, try again later.'});
        return;
    }

    const lang = order.language || 'uk';
    const anon = {
        uk: 'незнайомець',
        en: 'stranger'
    };
    const mailData = {
        ...order,
        UAH_amount: order.currency !== 'UAH' && req.body.UAH_amount,
        order_id: order._id,
        user: !!(order.donator_name || order.donator_surname),
        name: order.donator_name || anon[lang],
        surname: order.donator_surname,
        email: order.donator_email,
        newsletter: order.donator_newsletter,
        site_url: process.env.FRONTEND_URL,

    };

    // notify admin
    sendMail('admin/donate.step2', mailData, 'Этап 2: Человек ввёл свои реквизиты на ' + process.env.FRONTEND_URL);

    // notify user
    if (order.donator_email) {
        const subjects = {
            uk: 'Підтвердження вашого внеску на спільнокошті Ш++/KOWO',
            en: 'Confirmation of your donation to School++/KOWO'
        };
        sendMail(`user/${lang}/donate-confirmation`, mailData, subjects[lang], order.donator_email)
    }

    sendResponse(res, 200);
});

router.get('/list-subscriptions', async function(req, res) {
    const subscritpions = await Order.listSubscriptions();
    const money_amount = subscritpions.reduce((acc, {amount}) => acc+amount, 0);
    const donators_amount = subscritpions.length;

    // Respond with success and subscriptions info.
    sendResponse(res, 200, {money_amount, donators_amount});
});

module.exports = router;
