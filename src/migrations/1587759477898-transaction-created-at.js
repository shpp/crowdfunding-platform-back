'use strict';
const db = require("../db");

module.exports.up = async function () {
  await db.init(process.env.MONGODB_URI);
  const transactions = await db.db().collection("transactions").find({}).toArray();
  const updates = transactions.map(async (transaction) =>
      db.db().collection("transactions").updateOne({_id: transaction._id}, {
        $set: {
          created_at: transaction.time,
        },
      })
  );
  await Promise.all(updates);
  await db.close();
};

module.exports.down = async function () {
  await db.init(process.env.MONGODB_URI);
  await db.db().collection("transactions").updateMany({}, {
    $unset: {
      created_at: "",
    }
  });
  await db.close();
};
