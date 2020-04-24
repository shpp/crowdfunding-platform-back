const logger = require('./log');


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

module.exports.toHex = function (str) {
    let hex, i;

    let result = "";
    for (i = 0; i < str.length; i++) {
        hex = str.charCodeAt(i).toString(16);
        result += ("0" + hex).slice(-2);
    }

    return result
};

module.exports.stringifyField = function (obj, key = '_id') {
    return !obj ? null : {
        ...obj,
        [key]: String(obj[key])
    }
};
