const logger = require('./log');

module.exports.isValidProjectId = function (projectId) {
    // Must be a 24-digit hex string
    return typeof projectId == 'string' && (/^[0-9A-F]{24}$/i.test(projectId) || projectId === 'shpp-kowo');
};

module.exports.isValidTransactionId = function (transactionId) {
    // Must be a 24-digit hex string
    return typeof transactionId == 'string' && /^[0-9A-F]{24}$/i.test(transactionId);
};

module.exports.isValidAmount = function (amount) {
    return typeof amount === 'number' && !isNaN(amount) && isFinite(amount) && amount > 0;
};

module.exports.isValidPhoneNumber = function (phoneNumber) {
    return typeof phoneNumber == 'string' && /^\+?\d{10,12}$/.test(phoneNumber);
};

module.exports.isValidTimestamp = function (ts) {
    return typeof ts == 'number' && ts > 0;
};

module.exports.isValidUrl = function (url) {
    return typeof url == 'string' && /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=]+$/.test(url);
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

module.exports.isValidEnvironment = function (environment) {
    const environmentVariables = [
        'SERVER_URL',
        'MONGODB_URI',
        'LIQPAY_PUBLIC_KEY',
        'LIQPAY_PRIVATE_KEY',
        'FILE_STORAGE_PATH',
        'ADMIN_TOKEN'
    ];

    for (const variableName of environmentVariables) {
        if (environment[variableName] === undefined || environment[variableName].length === 0) {
            return false;
        }
    }

    return true;
};
module.exports.sendResponse = (res, code, data) => {
    logger.info(`[response] ${code} ${JSON.stringify(data)}`);
    if (code === 200) {
        res.status(200).send({
            ...data,
            success: true
        });
    } else {
        res.status(code).send({
            ...data,
            success: false
        })
    }
};

module.exports.toHex = function (str){
    let hex, i;

    let result = "";
    for (i=0; i<str.length; i++) {
        hex = str.charCodeAt(i).toString(16);
        result += ("0"+hex).slice(-2);
    }

    return result
};
