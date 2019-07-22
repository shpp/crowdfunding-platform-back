module.exports.isValidProjectId = function (projectId) {
    // Must be a 24-digit hex string
    return typeof projectId == 'string' && /^[0-9A-F]{24}$/i.test(projectId);
};

module.exports.isValidTransactionId = function (transactionId) {
    // Must be a 24-digit hex string
    return typeof transactionId == 'string' && /^[0-9A-F]{24}$/i.test(transactionId);
};

module.exports.isValidAmountString = function (amount) {
    amount = Number(amount);
    return typeof amount === 'number' && !isNaN(amount) && isFinite(amount) && amount > 0;
};

module.exports.isValidPhoneNumber = function (phoneNumber) {
    return typeof phoneNumber == 'string' && /^\+\d{12}$/.test(phoneNumber);
};

module.exports.multerImageFilter = function (req, file, cb) {
    // Check file size (Must be < 10MB)
    // if (file.size > 10000000) {
    //     cb(new Error('Maximum file size exceeded.'));
    //     return;
    // }

    // Check file extension
    // @TODO
    console.log(file.filename);
};

module.exports.checkEnvironment = function () {
    const environmentVariables = [
        'SERVER_URL',
        'MONGODB_URI',
        'LIQPAY_PUBLIC_KEY',
        'LIQPAY_PRIVATE_KEY',
        'FILE_STORAGE_PATH',
        'ADMIN_TOKEN'
    ];

    environmentVariables.forEach(variableName => {
        if (process.env[variableName] === undefined || process.env[variableName].length === 0) {
            console.error(variableName + ' environment variable is not set.');
            process.exit(-1);
        }
    })
};