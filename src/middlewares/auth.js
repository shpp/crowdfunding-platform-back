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

    if (token !== process.env.ADMIN_TOKEN) {
        res.status(401).send('Token is wrong.');
        return;
    }

    // Call next handler
    next();
};
