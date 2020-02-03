const assert = require('assert');

const {ObjectID} = require("mongodb");

const db = require('../db');
const utils = require('../utils');

const COLLECTION_NAME = 'projects';


module.exports.create = async function (name) {
    // Validate name
    if (typeof name !== 'string' || name.length === 0) {
        throw 'Name must be a string with length > 0.'
    }

    // Create project
    const project = {
        name,
        state: 'unpublished',
        description: '',
        plannedSpendings: '',
        actualSpendings: '',
        amount: 0,
        currency: 'UAH',
        creationTime: new Date()
    };

    // Save project record to DB
    const response = await db.db().collection(COLLECTION_NAME).insertOne(project);

    // Check the result
    return response.insertedCount === 1 ? response.insertedId : null;
};

module.exports.get = async function (id) {
    // Validate ID
    assert.ok(utils.isValidProjectId(id), 'Project ID must be a 24-digit hex string.');

    return await db.db().collection(COLLECTION_NAME).findOne({_id: ObjectID(id)});
};

module.exports.update = async function (id, name, state, description, plannedSpendings, actualSpendings, amount) {
    // Validate ID
    assert.ok(utils.isValidProjectId(id), 'Project ID must be a 24-digit hex string.');

    // Validate name
    if (typeof name !== 'string' || name.length === 0) {
        throw 'Name must be a string with length > 0.'
    }

    // Validate state
    if (typeof state !== 'string' || !(['unpublished', 'published', 'archived'].includes(state))) {
        throw 'State must be one of the following: [\'unpublished\', \'published\', \'archived\'].'
    }

    // Validate description
    if (typeof description !== 'string' || description.length === 0) {
        throw 'Description must be a string with length > 0.'
    }

    // Validate plannedSpendings
    if (typeof plannedSpendings !== 'string' || plannedSpendings.length === 0) {
        throw 'Planned spendings must be a string with length > 0.'
    }

    // Validate actualSpendings
    if (typeof actualSpendings !== 'string') {
        throw 'Actual spendings must be a string.'
    }

    // Validate amount
    if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount) || amount < 0) {
        throw 'Amount must be a non-negative real number.'
    }

    // Check if project exists
    if (await db.db().collection(COLLECTION_NAME).findOne({_id: ObjectID(id)}) === null) {
        return false;
    }

    // Update project record
    const response = await db.db().collection(COLLECTION_NAME).updateOne({_id: ObjectID(id)}, {
        $set: {
            name,
            state,
            description,
            plannedSpendings,
            actualSpendings,
            amount
        }
    });

    // Check the result
    return response.result.ok === 1;
};

module.exports.list = async function () {
    return (await db.db().collection(COLLECTION_NAME).find({}).toArray());
};
