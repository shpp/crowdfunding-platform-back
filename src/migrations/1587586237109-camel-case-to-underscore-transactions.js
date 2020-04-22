'use strict';
const db = require("../db");

module.exports.up = async function () {
  await db.init(process.env.MONGODB_URI);
  const transactions = await db.db().collection("transactions").find({}).toArray();
  const updates = transactions.map((transaction) => {
    return db.db().collection("transactions").updateOne({_id: transaction._id}, {
      $set: {
        project_id: transaction.projectId,
        payment_id: transaction.payemntId,
        donator_name: transaction.donatorName,
        donator_phone: transaction.donatorPhone,
      },
      // $unset: {
      // projectId: "",
      // payemntId: "",
      // donatorName: "",
      // donatorPhone: "",
      // }
    });
  });
  await Promise.all(updates);
  await db.close();
};

module.exports.down = async function () {
  await db.init(process.env.MONGODB_URI);
  await db.db().collection("transactions").updateMany({}, {
    $unset: {
      project_id: "",
      payment_id: "",
      donator_name: "",
      donator_phone: "",
    }
  });
  await db.close();
};
