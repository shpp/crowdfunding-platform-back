const assert = require('assert');

const db = require('../db');
const utils = require('../utils');

COLLECTION_NAME = 'transactions';

module.exports.create = async function (projectId, amount, type) {
    // Validate project ID
    assert.ok(utils.isValidProjectId(projectId), 'Project ID must be a 24-digit hex string.');

    // Validate amount
    if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount) || amount <= 0) {
        throw 'Amount must be a non-negative real number.'
    }

    // Validate type
    if (type !== 'cash' && type !== 'liqpay') {
        throw 'Only \'cash\' and \'liqpay\' types are supported.'
    }

    // Create transaction entry
    const transaction = {
        projectId,
        amount,
        type
    };

    // Save transaction record to DB
    const response = await db.db().collection(COLLECTION_NAME).insertOne(transaction);

    // Check the result
    return response.insertedCount === 1 ? response.insertedId : null;
};

module.exports.listByProjectId = async function (projectId) {
    // Validate project ID
    assert.ok(utils.isValidProjectId(projectId), 'Project ID must be a 24-digit hex string.');

    return (await db.db().collection(COLLECTION_NAME).find({projectId}).toArray());
};

module.exports.list = async function () {
    return (await db.db().collection(COLLECTION_NAME).find({}).toArray());
};