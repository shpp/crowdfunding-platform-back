const describe = require('mocha').describe;
const assert = require('assert');

const utils = require('../src/utils');

describe('Utils', function () {

    describe('isValidProjectId()', function () {

        it('Valid project ID', async function () {
            assert.ok(utils.isValidProjectId('5cd405cbf747eb3e79e63298'));
        });

        it('Invalid project IDs', async function () {
            assert.ok(!utils.isValidProjectId());
            assert.ok(!utils.isValidProjectId(''));
            assert.ok(!utils.isValidProjectId('5f78ad45'));
            assert.ok(!utils.isValidProjectId('gcd405cbf747eb3e79e63298'));
        });
    });

    describe('isValidTransactionId()', function () {

        it('Valid transaction ID', async function () {
            assert.ok(utils.isValidTransactionId('5cd405cbf747eb3e79e63298'));
        });

        it('Invalid transaction IDs', async function () {
            assert.ok(!utils.isValidTransactionId());
            assert.ok(!utils.isValidTransactionId(''));
            assert.ok(!utils.isValidTransactionId('5f78ad45'));
            assert.ok(!utils.isValidTransactionId('gcd405cbf747eb3e79e63298'));
        });
    });

    describe('isValidAmount()', function () {

        it('Valid amount strings', async function () {
            assert.ok(utils.isValidAmount(100));
            assert.ok(utils.isValidAmount(30.54));
        });

        it('Invalid amount strings', async function () {
            assert.ok(!utils.isValidAmount(0.0));
            assert.ok(!utils.isValidAmount(-30));
            assert.ok(!utils.isValidAmount(Infinity));
            assert.ok(!utils.isValidAmount());
        });
    });

    describe('isValidPhoneNumber()', function () {

        it('Valid phone numbers', async function () {
            assert.ok(utils.isValidPhoneNumber('+380507652296'));
            assert.ok(utils.isValidPhoneNumber('+380446660066'));
        });

        it('Invalid phone numbers', async function () {
            assert.ok(!utils.isValidPhoneNumber('0446660066'));
            assert.ok(!utils.isValidPhoneNumber('+38 044 666-00-66'));
            assert.ok(!utils.isValidPhoneNumber(380446660066));
        });
    });

    describe('isValidEnvironment()', function () {

        it('Valid environment', async function () {
            assert.ok(utils.isValidEnvironment({
                'SERVER_URL': 'https://donate.shpp.me',
                'MONGODB_URI': 'mongodb://localhost:27017/shpp-crowd-funding-test',
                'LIQPAY_PUBLIC_KEY': '123',
                'LIQPAY_PRIVATE_KEY': '123',
                'FILE_STORAGE_PATH': '/tmp',
                'ADMIN_TOKEN': '4f5qw5ijf2qEif=='
            }));
        });

        it('Invalid environments', async function () {
            assert.ok(!utils.isValidEnvironment({
                'SERVER_URL': 'https://donate.shpp.me'
            }));
        });
    });
});