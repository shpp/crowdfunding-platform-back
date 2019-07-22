const liqpay = require('../lib/liqpay');

const liqpayClient = liqpay(process.env.LIQPAY_PUBLIC_KEY, process.env.LIQPAY_PRIVATE_KEY);

module.exports = liqpayClient;

module.exports.verify = function (data, signature) {
    return liqpayClient.str_to_sign(process.env.LIQPAY_PRIVATE_KEY + data + process.env.LIQPAY_PRIVATE_KEY) === signature;
};