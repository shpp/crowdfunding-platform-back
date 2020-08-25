const validate = require('validate.js');

const validations = require('../validations');
const utils = require('../utils');
const logger = require('../log');

const routeToController = new Map(Object.entries({
    '/api/v1/projects': 'project',
    '/api/v1/transactions': 'transaction',
    '/api/v1/orders': 'order',
}));

const routeToValidator = new Map(Object.entries({
    '/shpp/donate': 'create',
    '/shpp/donated': 'update',
    '/create': 'create',
    '/update': 'update',
    '/revoke': 'toggle',
    '/reaffirm': 'toggle',
    '/list': 'list',
    '/liqpay-confirmation': 'createLiqpay',
    '/button': 'button',
    '/list-subscriptions': 'list'
}));

module.exports = function(req, res, next) {
    const controllerValidator = routeToController.get(req.baseUrl);
    const routeValidator = routeToValidator.get(req.path);
    const data = req.method === 'GET' ? req.query : req.body;
    const validation = validate(data, validations[controllerValidator][routeValidator]);
    if(validation) {
        logger.error('Invalid request', {data: validation});
        utils.sendResponse(res, 400, validation);
        return;
    }
    logger.info('Request is valid, processing...');
    next()
};
