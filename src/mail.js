const nodemailer = require('nodemailer');
const handlebars = require("handlebars");
var layouts = require('handlebars-layouts');
const fs = require("fs");

const logger = require('./log');

handlebars.registerHelper(layouts(handlebars));

let transporter = nodemailer.createTransport({
    port: 587,
    host: process.env.SES_HOST,
    auth: {
        user: process.env.SES_USER,
        pass: process.env.SES_PASS
    }
}, {
    from: `"Donation portal" ${process.env.SES_FROM}`,
});

const getEmailTemplatePath = (templateName) => `${__dirname}/emails/${templateName}.handlebars`;

module.exports.sendMail = (
    templateName,
    templateVariables,
    subject = "Уведомление с " + process.env.FRONTEND_URL,
    recipient = process.env.ADMIN_MAIL
) => {
    // TODO: remove return!!
    // return;
    fs.readFile(getEmailTemplatePath(templateName), 'utf-8', function (emailReadingError, rawEmail) {
        if (emailReadingError) {
            logger.error(`Could not read email template ${templateName}`, {data: emailReadingError});
            return;
        }
        if(recipient !== process.env.ADMIN_MAIL) {
            const layoutFileName = getEmailTemplatePath('user/' + templateName.split('/')[1] + '/layout');
            handlebars.registerPartial('layout', fs.readFileSync(layoutFileName, 'utf8'));
            logger.debug('recipient is not admin', {data: recipient, layoutFileName})
        } else {
            const layoutFileName = getEmailTemplatePath('admin/layout');
            handlebars.registerPartial('layout', fs.readFileSync(layoutFileName, 'utf8'));
            logger.debug('recipient is admin', {data: recipient, layoutFileName})
        }

        const template = handlebars.compile(rawEmail)(templateVariables);
        logger.info('Going to send email...', {data: {recipient, templateName, templateVariables}});

        transporter.sendMail({
            to: recipient,
            subject,
            html: template
        }, (emailSendingError) => {
            if (emailSendingError) {
                logger.error(`Could not send email to ${recipient}`, {data: {emailSendingError, templateName}});
                return
            }
            logger.info("Successfully sent mail!", {data: {templateName, recipient}})
        })
    })
};
