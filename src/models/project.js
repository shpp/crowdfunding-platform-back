const validate = require('validate.js');

const {ObjectID} = require("mongodb");

const db = require('../db');
const utils = require('../utils');
const logger = require('../log');
const validations = require('../validations');
const {stringifyField} = require("../utils");

const COLLECTION_NAME = 'projects';

module.exports.create = async function (data) {
    const validation = validate(data, validations.project.create);
    if (validation) {
        logger.error('Invalid action "create project"', {data: {validation, data}});
        return
    }

    // Create project
    const project = {
        name: data.name,
        state: 'unpublished',
        created_at: ~~(+new Date())
    };

    // Save project record to DB
    const response = await db.db().collection(COLLECTION_NAME).insertOne(project);

    // Check the result
    return response.insertedCount === 1 ? response.insertedId : null;
};

module.exports.get = async function (id) {
    const validation = validate({id}, validations.project.get);
    if (validation) {
        logger.error('Invalid action "get project"', {data: {validation, id}});
        return
    }

    return stringifyField(await db.db().collection(COLLECTION_NAME).findOne({_id: ObjectID(id)}));
};

module.exports.find = async function (search) {
    return stringifyField(await db.db().collection(COLLECTION_NAME).findOne(search));
};

module.exports.update = async function (data) {
    const validation = validate(data, validations.project.update);
    if (validation) {
        logger.error('Invalid action "update project"', {data: {validation, data}});
        return;
    }

    // Check if project exists
    if (await db.db().collection(COLLECTION_NAME).findOne({_id: ObjectID(data.id)}) === null) {
        return false;
    }
    const projectFields = [
        'name_uk', 'description_uk', 'short_description_uk',
        'planned_spendings_uk', 'actual_spendings_uk',
        'name_en', 'description_en', 'short_description_en',
        'planned_spendings_en', 'actual_spendings_en',
        'image', 'currency', 'amount', 'state',
        'created_at'
    ];

    // Update project record
    const response = await db.db().collection(COLLECTION_NAME).updateOne({_id: ObjectID(data.id)}, {
        $set: projectFields.reduce((acc, key) => ({
            ...acc,
            [key]: data[key]
        }), {})
    });

    // Check the result
    return response.result.ok === 1;
};

module.exports.list = async function () {
    return (await db.db().collection(COLLECTION_NAME).find({}).toArray()).map(stringifyField);
};
