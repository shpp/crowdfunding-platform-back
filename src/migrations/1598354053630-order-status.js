'use strict';
const db = require("../db");

module.exports.up = async function () {
  await db.init(process.env.MONGODB_URI);
  await db.db().collection("orders").updateMany({status: 'step-2', subscribe: true}, {
    $set: {
      status: 'subscribed'
    },
  });
  await db.close();
};

module.exports.down = async function () {
  await db.init(process.env.MONGODB_URI);
  await db.db().collection("orders").updateMany({status: 'subscribed'}, {
    $set: {
      status: 'step-2'
    }
  });
  await db.close();
};
