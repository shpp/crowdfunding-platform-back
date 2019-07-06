const describe = require('mocha').describe;
const assert = require('assert');

const db = require('../../src/db');
const transaction = require('../../src/models/transaction');

const testProjectId = '5cd405cbf747eb3e79e63298';

describe('Transaction', function () {

    // Initialize DB before tests
    before(async function () {
        await db.init(process.env.MONGODB_URI);
    });

    // Clear DB before each test
    beforeEach(async function () {
        await db.clear();
    });

    it('should create a transaction', async function () {
        assert.strictEqual((await transaction.create(testProjectId, 1000, 'liqpay')).constructor.name, 'ObjectID');
    });

    it('should not create a transaction for invalid project ID', async function () {
        await assert.rejects(transaction.create('123', 1000, 'liqpay'));
    });

    it('should not create a transaction with invalid amount', async function () {
        await assert.rejects(transaction.create(testProjectId, 0, 'liqpay'));
    });

    it('should not create a transaction with invalid type', async function () {
        await assert.rejects(transaction.create(testProjectId, 0, 'bitcoin'));
    });

    it('should list all transactions', async function () {
        await transaction.create(testProjectId, 500, 'liqpay');
        await transaction.create('7f3a7d8bf747eb3e79e63910', 300, 'cash');

        const transactions = await transaction.list();

        assert.strictEqual(transactions.length, 2);
        assert.strictEqual(transactions.reduce((sum, t) => sum + t.amount, 0), 800);
    });

    it('should list all transactions by project ID', async function () {
        await transaction.create(testProjectId, 500, 'liqpay');
        await transaction.create(testProjectId, 200, 'cash');
        await transaction.create('7f3a7d8bf747eb3e79e63910', 300, 'cash');

        const projectTransactions = await transaction.listByProjectId(testProjectId);

        assert.strictEqual(projectTransactions.length, 2);
        assert.strictEqual(projectTransactions.reduce((sum, t) => sum + t.amount, 0), 700);
    });

    // Clear DB and close connection after testing
    after(async function () {
        await db.clear();
        await db.close();
    });
});