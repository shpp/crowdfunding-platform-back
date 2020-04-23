'use strict';
const db = require("../db");
const {ObjectID} = require("mongodb");

module.exports.up = async function () {
  await db.init(process.env.MONGODB_URI);
  const transactions = await db.db().collection("transactions").find({}).toArray();
  const project = await db.db().collection("projects").findOne({slug: 'shpp-kowo'});
  const updates = transactions.map(async (transaction) => {
    if (String(transaction.project_id) === "2e2e2e736870702d6b6f776f") {
      return db.db().collection("transactions").updateOne({_id: transaction._id}, {
        $set: {
          project_id: project._id,
        },
      });
    } return async () => null;
  });
  await Promise.all(updates);
  await db.close();
};

module.exports.down = async function () {
  await db.init(process.env.MONGODB_URI);
  const project = await db.db().collection("projects").findOne({slug: 'shpp-kowo'});
  await db.db().collection("transactions").updateMany({
    project_id: project._id
  }, {
    $set: {
      project_id: ObjectID("2e2e2e736870702d6b6f776f"),
    }
  });
  await db.close();
};
