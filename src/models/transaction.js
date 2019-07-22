const assert = require('assert');

const {ObjectID} = require("mongodb");

const db = require('../db');
const utils = require('../utils');

const COLLECTION_NAME = 'transactions';

module.exports.create = async function (projectId, type, amount, donatorName, donatorPhone, paymentId) {
    // Validate project ID
    assert.ok(utils.isValidProjectId(projectId), 'Project ID must be a 24-digit hex string.');

    // Validate type
    if (type !== 'manual' && type !== 'liqpay') {
        throw 'Only \'manual\' and \'liqpay\' types are supported.'
    }

    // Validate amount
    assert.ok(utils.isValidAmountString(amount), 'Amount must be a positive real number.');

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

    // Create transaction entry
    const transaction = {
        projectId: ObjectID(projectId),
        amount: parseFloat(amount),
        type,
        donatorName,
        donatorPhone,
        paymentId,
        time: new Date(),
        status: 'confirmed'
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
    return response.result.ok === 1 && response.result.nModified === 1;
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
    return response.result.ok === 1 && response.result.nModified === 1;
};

module.exports.listByProjectId = async function(projectId) {
    // Validate project ID
    assert.ok(utils.isValidProjectId(projectId), 'Project ID must be a 24-digit hex string.');

    return (await db.db().collection(COLLECTION_NAME).find({projectId: ObjectID(projectId)}).toArray());
};

module.exports.list = async function () {
    return (await db.db().collection(COLLECTION_NAME).find({}).toArray());
};