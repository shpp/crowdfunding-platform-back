const {ObjectID} = require("mongodb");
const validate = require("validate.js");

const db = require('../db');
const logger = require('../log');
const validations = require('../validations');

const COLLECTION_NAME = 'transactions';

module.exports.create = async function (data) {
    const validation = validate(data, validations.transaction.create);
    if (validation) {
        logger.error('Invalid action "create transaction"', {data: {validation, data}});
        return null;
    }

    const transactionFields = [
        'type', 'donator_name', 'donator_phone',
        'donator_surname', 'donator_email', 'payment_id',
        'subscription', 'amount', 'status', 'action', 'order_id',
        'liqpay_order_id'
    ];

    // Update project record
    let transaction = transactionFields.reduce((acc, key) => ({
        ...acc,
        [key]: data[key]
    }), {});

    const project_id = ObjectID(data.project_id);
    const order_id = ObjectID(data.order_id);

    transaction = {
        ...transaction,
        project_id,
        order_id,
        created_at: new Date(),
    };

    // Save transaction record to DB
    const response = await db.db().collection(COLLECTION_NAME).insertOne(transaction);

    // Check the result
    return response.insertedCount === 1 ? response.insertedId : null;
};

module.exports.revoke = async function (data) {
    const validation = validate(data, validations.transaction.toggle);
    if (validation) {
        logger.error('Invalid action "revoke transaction"', {data: {validation, data}});
        return null;
    }
    // Update transaction record
    const response = await db.db().collection(COLLECTION_NAME).updateOne({_id: ObjectID(data.id)}, {
        $set: {
            status: 'revoked'
        }
    });

    // Check the result
    return response.result.ok === 1;
};

module.exports.reaffirm = async function (data) {
    const validation = validate(data, validations.transaction.toggle);
    if (validation) {
        logger.error('Invalid action "reaffirm transaction"', {data: {validation, data}});
        return null;
    }

    // Update transaction record
    const response = await db.db().collection(COLLECTION_NAME).updateOne({_id: ObjectID(data.id)}, {
        $set: {
            status: 'success'
        }
    });

    // Check the result
    return response.result.ok === 1;
};

module.exports.listByProjectId = async function (id) {
    const validation = validate({id: String(id)}, validations.transaction.list);
    if (validation) {
        logger.error('Invalid action "list transactions by project id"', {data: {validation, id}});
        return null;
    }

    return (await db.db().collection(COLLECTION_NAME).find({project_id: ObjectID(id)}).toArray())
        .filter(({status}) => status === 'success');
};

module.exports.list = async function () {
    return (await db.db().collection(COLLECTION_NAME).find({}).toArray());
};
