module.exports = function () {
    return {
        testFramework: 'mocha',
        files: [
            'src/**/*.js'
        ],
        tests: [
            'test/**/*_test.js'
        ],
        env: {
            type: 'node',
            params: {
                // For local testing only
                env: 'MONGODB_URI=mongodb://localhost:27017/crowdfunding-test'
            }
        },
        workers: {
            initial: 1,
            regular: 1,
            restart: true
        }
    }
};