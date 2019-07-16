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
        assert.strictEqual((await transaction.create(testProjectId, 'liqpay', 1000)).constructor.name, 'ObjectID');
    });

    it('should not create a transaction for invalid project ID', async function () {
        await assert.rejects(transaction.create('123', 'liqpay', 1000));
    });

    it('should not create a transaction with invalid amount', async function () {
        await assert.rejects(transaction.create(testProjectId, 'liqpay', 0));
    });

    it('should not create a transaction with invalid type', async function () {
        await assert.rejects(transaction.create(testProjectId, 'bitcoin', 0));
    });

    it('should list all transactions', async function () {
        await transaction.create(testProjectId, 'liqpay', 500);
        await transaction.create('7f3a7d8bf747eb3e79e63910', 'manual', 300);

        const transactions = await transaction.list();

        assert.strictEqual(transactions.length, 2);
        assert.strictEqual(transactions.reduce((sum, t) => sum + t.amount, 0), 800);
    });

    it('should list all transactions by project ID', async function () {
        await transaction.create(testProjectId, 'liqpay', 500);
        await transaction.create(testProjectId, 'manual', 200);
        await transaction.create('7f3a7d8bf747eb3e79e63910', 'manual', 300);

        const projectTransactions = await transaction.listByProjectId(testProjectId);

        assert.strictEqual(projectTransactions.length, 2);
        assert.strictEqual(projectTransactions.reduce((sum, t) => sum + t.amount, 0), 700);
    });

    it('should revoke and reaffirm a transaction', async function () {
        const transactionId = await transaction.create(testProjectId, 'liqpay', 500);

        await assert.doesNotReject(transaction.revoke(String(transactionId)));
        assert.strictEqual((await transaction.list())[0].status, 'revoked');

        await assert.doesNotReject(transaction.reaffirm(String(transactionId)));
        assert.strictEqual((await transaction.list())[0].status, 'confirmed');
    });

    // Clear DB and close connection after testing
    after(async function () {
        await db.clear();
        await db.close();
    });
});