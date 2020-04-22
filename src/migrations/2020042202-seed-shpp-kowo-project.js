const db = require('../db');
const log = require('../log');

module.exports = {
    async up() {
        await db.init(process.env.MONGODB_URI);
        const project = await db.db().collection("projects").findOne({slug: 'shpp-kowo'});
        if(!project) {
            log.info('DB: shpp project does not exists, creating');
            return db.db().collection("projects").insertOne({
                slug: 'shpp-kowo',
                name: 'Діяльність Ш++/КОВО',
                state: 'unpublished',
                created_at: Date.now()
            })
        }
        await db.close();
    },
    async down() {
        log.info('DB: deleting shpp project');
        await db.init(process.env.MONGODB_URI);
        await db.db().collection("projects").deleteOne({slug: 'shpp-kowo'});
        await db.close();
    },
};
