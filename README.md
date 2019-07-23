# [shpp] Crowd-funding backend engine [![Build Status](https://travis-ci.org/shpp/crowdfunding-platform-back.svg?branch=master)](https://travis-ci.org/shpp/crowdfunding-platform-back) [![Coverage Status](https://coveralls.io/repos/github/shpp/crowdfunding-platform-back/badge.svg?branch=master)](https://coveralls.io/github/shpp/crowdfunding-platform-back?branch=master)

## Prerequisites & installation
In order to run application you need to first edit start.sh file and change environment variables values in it to match your actual environment (DB URI, LiqPay keys, etc.) 

```
$ npm install
$ npm start
```

## Migration Notes

## Possible Improvements

Features:
- PayPal and other payment methods integration
- Multi-language support

Security and stability:
- Sessions and users implementation.
- Increase test coverage

Code quality and maintainability:
- Utilizing express request validator to avoid copy-pasting in routers.