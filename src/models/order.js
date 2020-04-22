const validate = require('validate.js');

const {ObjectID} = require("mongodb");

const db = require('../db');
const validations = require("../validations");
const {stringifyField} = require("../utils");
const logger = require('../log');
const Project = require("./project");

const COLLECTION_NAME = 'orders';

const orderFields = new Map(Object.entries({
    donator_email: 'email',
    donator_name: 'name',
    donator_surname: 'surname',
    donator_newsletter: 'newsletter',
    transaction_id: 'transactionId',

    subscribe: 'subscribe',
    amount: 'amount',
    currency: 'currency',
    language: 'language',

    status: 'status'
}));

module.exports.create = async function (data) {
    const validation = validate(data, validations.order.create);
    if (validation) {
        logger.error('Invalid action "create order"', {data: {validation, data}});
        return
    }
    const { _id: project_id } = await Project.getByField('shpp-kowo', 'slug');
    // Create order
    const order = {
        created_at: ~~(+new Date()),
        project_id
    };
    orderFields.forEach((value, key) => {
        order[key] = data[value]
    });

    // Save order record to DB
    const response = await db.db().collection(COLLECTION_NAME).insertOne(order);

    // Check the result
    return response.insertedCount === 1 ? response.insertedId : null;
};

module.exports.get = async function (id) {
    const validation = validate({id}, validations.order.get);
    if (validation) {
        logger.error('Invalid action "get order"', {data: {validation, id}});
        return
    }

    return stringifyField(await db.db().collection(COLLECTION_NAME).findOne({_id: ObjectID(id)}));
};

module.exports.update = async function (id) {
    const validation = validate({id}, validations.order.update);
    if (validation) {
        logger.error('Invalid action "update order"', {data: {validation, id}});
        return false;
    }
    const previousOrder = await db.db().collection(COLLECTION_NAME).findOne({_id: ObjectID(id)});

    // Check if order exists
    if (previousOrder === null) {
        return false;
    }

    const newOrder  = {};
    orderFields.forEach((value, key) => {
        newOrder[key] = data[value] || previousOrder[key]
    });


    // Update order record
    const response = await db.db().collection(COLLECTION_NAME).updateOne({_id: ObjectID(id)}, {
        $set: newOrder
    });

    // Check the result
    return response.result.ok === 1 ? previousOrder : response.result.ok;
};

module.exports.list = async function () {
    return (await db.db().collection(COLLECTION_NAME).find({}).toArray()).map(stringifyField);
};
