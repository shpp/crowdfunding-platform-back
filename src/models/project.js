const assert = require('assert');

const db = require('../db');

COLLECTION_NAME = 'projects';


module.exports.create = async function (name) {
    // Validate name
    if (typeof name !== 'string' || name.length === 0) {
        throw 'Name must be a string with length > 0.'
    }

    // Create project
    const project = {
        name,
        description: '',
        plannedSpendings: '',
        actualSpendings: '',
        amount: 0,
        currency: 'UAH',
        creationTime: new Date(),
        published: false
    };

    // Save project record to DB
    const response = await db.db().collection(COLLECTION_NAME).insertOne(project);

    // Check the result
    return response.insertedCount === 1 ? response.insertedId : null;
};

module.exports.update = async function (id, name, description, plannedSpendings, actualSpendings, amount) {
    // Validate project ID
    assert.strictEqual(id.constructor.name, 'ObjectID', '\'id\' must be an ObjectID');

    // Validate name
    if (typeof name !== 'string' || name.length === 0) {
        throw 'Name must be a string with length > 0.'
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
        throw 'Actual spendings must be a string with length > 0.'
    }

    // Validate amount
    if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount) || amount < 0) {
        throw 'Amount must be a non-negative real number.'
    }

    // Update project record
    const response = await db.db().collection(COLLECTION_NAME).updateOne({_id: id}, {
        $set: {
            name,
            description,
            plannedSpendings,
            actualSpendings,
            amount
        }
    });

    // Check the result
    return response.result.ok === 1 && response.result.nModified === 1;
};


module.exports.publish = async function (id) {
    // Validate ID
    assert.strictEqual(id.constructor.name, 'ObjectID', '\'id\' must be an ObjectID');

    const project = await db.db().collection(COLLECTION_NAME).findOne({_id: id});

    if (project === null || project.published) {
        return false;
    }

    // Update project record
    const response = await db.db().collection(COLLECTION_NAME).updateOne({_id: id}, {
        $set: {
            published: true
        }
    });

    // Check the result
    return response.result.ok === 1 && response.result.nModified === 1;
};

module.exports.list = async function () {
    return (await db.db().collection(COLLECTION_NAME).find({}).toArray());
};