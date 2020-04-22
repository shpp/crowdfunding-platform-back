'use strict';
const db = require("../db");

module.exports.up = async function () {
  await db.init(process.env.MONGODB_URI);
  const project = await db.db().collection("projects").findOne({slug: 'shpp-kowo'});
  if(!project) {
    return db.db().collection("projects").insertOne({
      slug: 'shpp-kowo',
      name: 'Діяльність Ш++/КОВО',
      state: 'unpublished',
      created_at: Date.now()
    })
  }
  await db.close();
};

module.exports.down = async function () {
  await db.init(process.env.MONGODB_URI);
  await db.db().collection("projects").deleteOne({slug: 'shpp-kowo'});
  await db.close();
};
