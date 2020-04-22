'use strict';
const db = require("../db");

module.exports.up = async function () {
  await db.init(process.env.MONGODB_URI);
  const projects = await db.db().collection("projects").find({}).toArray();
  const updates = projects.map((project) => {
    return db.db().collection("projects").updateOne({_id: project._id}, {
      $set: {
        short_description: project.shortDescription,
        actual_spendings: project.actualSpendings,
        planned_spendings: project.plannedSpendings,
        created_at: project.createdAtTS,
      },
      // $unset: {
      //     shortDescription: "",
      //     actualSpendings: "",
      //     plannedSpendings: "",
      //     createdAtTS: ""
      // }
    });
  });
  await Promise.all(updates);
  await db.close();
};

module.exports.down = async function () {
  await db.init(process.env.MONGODB_URI);
  await db.db().collection("projects").updateMany({}, {
    $unset: {
      short_description: "",
      actual_spendings: "",
      planned_spendings: "",
      created_at: "",
    }
  });
  await db.close();
};
