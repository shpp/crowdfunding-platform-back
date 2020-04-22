const db = require("../db");

module.exports = {
    async up() {
        await db.init(process.env.MONGODB_URI);
        const projects = await db.db().collection("projects").find({}).toArray();
        const updates = projects.map((project) => {
            return db.db().collection("projects").updateOne({_id: project._id}, {
                $set: {
                    name_uk: project.name,
                    name_en: project.name,
                    short_description_en: project.short_description,
                    short_description_uk: project.short_description,
                    description_en: project.description,
                    description_uk: project.description,
                    actual_spendings_en: project.actual_spendings,
                    actual_spendings_uk: project.actual_spendings,
                    planned_spendings_en: project.planned_spendings,
                    planned_spendings_uk: project.planned_spendings,
                }
            })
        });
        await Promise.all(updates);
        await db.close();
    },
    async down() {
        await db.init(process.env.MONGODB_URI);
        const updated = await db.db().collection("projects").updateMany({}, {
            $unset: {
                name_uk: "",
                name_en: "",
                short_description_en: "",
                short_description_uk: "",
                description_en: "",
                description_uk: "",
                actual_spendings_en: "",
                actual_spendings_uk: "",
                planned_spendings_en: "",
                planned_spendings_uk: "",
            }
        });
        await db.close();
        return updated;
    },
};
