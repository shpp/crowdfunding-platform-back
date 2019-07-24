const describe = require('mocha').describe;
const assert = require('assert');

const log = require('../src/log');

describe('Log', function () {
    it('should log a string', async function () {
        log.info("Test log")
    });
});