const describe = require('mocha').describe;
const assert = require('assert');

const db = require('../../src/db');
const project = require('../../src/models/project');

// Testing assets
const testProjectName = 'Projector';
const testProjectDescription = 'We need it for the educational purposes.';
const testPlannedSpendings = 'Airtame, Sony HDR 9000 Ultra Hi-Res Pro Retina+';

describe('Project', function () {

    // Initialize DB before tests
    before(async function () {
        await db.init(process.env.MONGODB_URI);
    });

    // Clear DB before each test
    beforeEach(async function () {
        await db.clear();
    });

    it('should create a project', async function () {
        const id = await project.create(testProjectName);
        assert.strictEqual(id.constructor.name, 'ObjectID');
        assert.strictEqual((await project.get(String(id))).name, testProjectName);
    });

    it('should not create project with a wrong name', async function () {
        await assert.rejects(project.create(123));
    });

    it('should update a project', async function () {
        const projectId = String(await project.create(testProjectName));
        const newName = 'Sony HDR 9000+';
        const newState = 'published';
        const newAmount = 1000;
        assert.ok(await project.update(projectId, newName, newState, testProjectDescription, testPlannedSpendings, '', newAmount));
        const updatedProject = (await project.list())[0];
        assert.strictEqual(updatedProject.name, newName);
        assert.strictEqual(updatedProject.state, newState);
        assert.strictEqual(updatedProject.description, testProjectDescription);
        assert.strictEqual(updatedProject.plannedSpendings, testPlannedSpendings);
        assert.strictEqual(updatedProject.amount, newAmount);
    });

    it('should not update a project that not exist', async function () {
        assert.strictEqual(await project.update('5cd405cbf747eb3e79e63298', testProjectName, 'unpublished', testProjectDescription, testPlannedSpendings, testPlannedSpendings, 1000), false);
    });

    it('should publish a project', async function () {
        const projectId = String(await project.create(testProjectName));
        assert.ok(await project.update(projectId, testProjectName, 'published', testProjectDescription, testPlannedSpendings, testPlannedSpendings, 1000), false);
        const publishedProject = (await project.get(projectId));
        assert.strictEqual(publishedProject.state, 'published');
    });

    it('should archive a project', async function () {
        const projectId = String(await project.create(testProjectName));
        assert.ok(await project.update(projectId, testProjectName, 'archived', testProjectDescription, testPlannedSpendings, testPlannedSpendings, 1000), false);
        const publishedProject = (await project.get(projectId));
        assert.strictEqual(publishedProject.state, 'archived');
    });

    // Clear DB and close connection after testing
    after(async function () {
        await db.clear();
        await db.close();
    });
});
