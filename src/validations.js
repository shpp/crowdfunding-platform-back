const validate = require('validate.js');

const required = {presence: {allowEmpty: false}};
const ID = {
    ...required,
    type: 'string',
    format: /^[0-9A-Fa-f]{24}$|shpp-kowo/i,
};
const amount = {
    ...required,
    type: 'number',
    numericality: {notLessThan: 0}
};
const currency = {
    ...required,
    inclusion: ['UAH', 'USD', 'EUR']
};
const language = {inclusion: ['uk', 'en']};

const allowEmpty = (value, config) => validate.isEmpty(value) ? null : config;

module.exports.order = {
    create: {
        amount,
        currency,
        subscribe: {
            ...required,
            type: 'boolean'
        },
        language: (value) => allowEmpty(value, language),
        email: (value) => allowEmpty(value, {email: true}),
        name: (value) => allowEmpty(value, {type: 'string'}),
        surname: (value) => allowEmpty(value, {type: 'string'}),
        phone: (value) => allowEmpty(value, {type: 'string'}),
        newsletter: (value) => allowEmpty(value, {type: 'boolean'})
    },
    get: {id: ID},
    update: {id: ID},
    list: {}
};

module.exports.env = {
    SERVER_URL: {...required},
    FRONTEND_URL: {...required},

    SES_HOST: {...required},
    SES_USER: {...required},
    SES_FROM: {...required},
    SES_PASS: {...required},
    ADMIN_MAIL: {...required},

    MONGODB_URI: {...required},

    LIQPAY_PUBLIC_KEY: {...required},
    LIQPAY_PRIVATE_KEY: {...required},

    FILE_STORAGE_PATH: {...required},

    ADMIN_TOKEN: {...required},
};

module.exports.project = {
    create: {
        name: {...required}
    },
    get: {id: ID},
    update: {
        id: ID,
        currency,
        amount,
        // en locale
        name_en: {...required},
        description_en: {...required},
        short_description_en: {...required},
        planned_spendings_en: {...required},
        actual_spendings_en: {...required},
        // ua locale
        name_uk: {...required},
        description_uk: {...required},
        short_description_uk: {...required},
        planned_spendings_uk: {...required},
        actual_spendings_uk: {...required},
        state: {
            ...required,
            inclusion: ['unpublished', 'published', 'archived']
        },
        created_at: {
            ...required,
            type: 'number'
        },
        image: {
            ...required,
            url: true
        }
    },
    button: {
        id: ID,
        language: (value) => allowEmpty(value, language),
        currency: (value) => allowEmpty(value, currency),
    }
};

module.exports.transaction = {
    create: {
        amount,
        project_id: ID,
        donator_phone: (value) => allowEmpty(value, {
            format: /\+?[0-9]{10,12}/
        }),
        subscription: (value) => allowEmpty(value, {
            type: 'boolean'
        }),
        type: {
            ...required,
            inclusion: ['manual', 'liqpay']
        },
        status: {
            ...required,
            inclusion: ['success', 'subscribed', 'wait_accept']
        },
    },
    update: {
        _id: ID,
        donator_phone: (value) => allowEmpty(value, {
            format: /\+?[0-9]{10,12}/
        }),
        donator_name: (value) => allowEmpty(value, {type: 'string'}),
    },
    toggle: {id: ID},
    list: {
        id: (value) => allowEmpty(value, ID)
    },
    createLiqpay: {
        data: {...required},
        signature: {...required}
    }
};


