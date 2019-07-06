const crypto = require("crypto");

const adminUserName = 'admin';
const adminPassword = '123';
const salt = 'HXVS64VFFJ';

function authToken(user, password, salt) {
    const hash = crypto.createHash('sha256');
    return Buffer.from(user + ':' + hash.update(salt + ':' + password).digest('hex')).toString('base64')
}

module.exports = async function (req, res, next) {
    // Check if authorization header exist in the request
    if (!req.headers.authorization) {
        res.status(401).send('Authorization required.');
        return;
    }

    // Check if authorization type is Basic
    if (req.headers.authorization.search('Basic ') !== 0) {
        res.status(401).send('Only Basic authorization is supported.');
        return;
    }

    // Extract authorization token
    const token = req.headers.authorization.split(' ')[1];

    if (token !== authToken(adminUserName, adminPassword, salt)) {
        res.status(500).send('Token is wrong.');
        return;
    }

    // Call next handler
    next();
};
