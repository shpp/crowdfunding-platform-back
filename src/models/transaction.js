const {toHex} = require('../utils');

const assert = require('assert');

const {ObjectID} = require("mongodb");

const db = require('../db');
const utils = require('../utils');

const COLLECTION_NAME = 'transactions';

module.exports.create = async function ({projectId, type, amount, donatorName, donatorPhone, paymentId, status, subscription}) {
    // Validate project ID
    assert.ok(utils.isValidProjectId(projectId), 'Project ID must be a 24-digit hex string or shpp-kowo.');

    // Validate type
    if (type !== 'manual' && type !== 'liqpay') {
        throw 'Only \'manual\' and \'liqpay\' types are supported.'
    }

    // Validate amount
    assert.ok(utils.isValidAmount(amount), 'Amount must be a positive real number.');

    // Validate donator name
    if (donatorName !== undefined && (typeof donatorName !== 'string' || donatorName.length === 0)) {
        throw 'Wrong donator name.';
    }

    // Validate donator phone
    if (donatorPhone !== undefined && !utils.isValidPhoneNumber(donatorPhone)) {
        throw 'Wrong donator phone number.';
    }

    // Validate paymentId
    if (paymentId !== undefined && typeof paymentId !== 'string') {
        throw 'Payment ID must be a string.';
    }
    // Validate paymentId
    if (subscription === undefined || typeof subscription !== 'boolean') {
        throw 'Wrong ot missing subscription type.';
    }

    // Create transaction entry
    const transaction = {
        type,
        donatorName,
        donatorPhone,
        paymentId,
        subscription,
        projectId: ObjectID(projectId === 'shpp-kowo' ? toHex(projectId.padStart(12, '.')) : projectId),
        amount: parseFloat(amount),
        time: new Date(),
        status: ['success', 'wait_accept', 'subscribed'].includes(status) ? 'confirmed' : status
    };

    // Save transaction record to DB
    const response = await db.db().collection(COLLECTION_NAME).insertOne(transaction);

    // Check the result
    return response.insertedCount === 1 ? response.insertedId : null;
};

module.exports.revoke = async function(transactionId) {
    // Validate transaction ID
    assert.ok(utils.isValidTransactionId(transactionId), 'Transaction ID must be a 24-digit hex string.');

    // Update transaction record
    const response = await db.db().collection(COLLECTION_NAME).updateOne({_id: ObjectID(transactionId)}, {
        $set: {
            status: 'revoked'
        }
    });

    // Check the result
    return response.result.ok === 1;
};

module.exports.reaffirm = async function(transactionId) {
    // Validate transaction ID
    assert.ok(utils.isValidTransactionId(transactionId), 'Transaction ID must be a 24-digit hex string.');

    // Update transaction record
    const response = await db.db().collection(COLLECTION_NAME).updateOne({_id: ObjectID(transactionId)}, {
        $set: {
            status: 'confirmed'
        }
    });

    // Check the result
    return response.result.ok === 1;
};

module.exports.listByProjectId = async function(projectId) {
    // Validate project ID
    assert.ok(utils.isValidProjectId(projectId), 'Project ID must be a 24-digit hex string.');

    return (await db.db().collection(COLLECTION_NAME).find({projectId: ObjectID(projectId)}).toArray());
};

module.exports.list = async function () {
    return (await db.db().collection(COLLECTION_NAME).find({}).toArray());
};
