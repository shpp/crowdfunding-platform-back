const {MongoClient} = require("mongodb");
const assert = require('assert');
const {URL} = require('url');

// Global variables for DB client and instance handling
let client;
let db;


module.exports.init = async function (url) {
    if (db !== undefined) {
        throw 'Trying to initialize already initialized Database.';
    }

    // Connect to MongoDB
    client = await MongoClient.connect(url, {
        useNewUrlParser: true
    });

    // Retrieve Database
    db = client.db(new URL(url).pathname.slice(1));
};

module.exports.db = function () {
    assert.ok(db, 'Database isn\'t initialized. Call init() first.');

    return db;
};

module.exports.clear = async function() {
    assert.ok(db, 'Database isn\'t initialized. Call init() first.');

    // Drop all collections
    const collections = await db.listCollections({}, {nameOnly: true}).toArray();
    for (const collection of collections) {
        await db.dropCollection(collection.name);
    }
};

module.exports.close = async function () {
    assert.ok(client, 'Client isn\'t initialized. Call init() first.');

    await client.close(false);

    db = undefined;
    client = undefined;
};
