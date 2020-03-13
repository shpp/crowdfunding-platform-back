const nodemailer = require('nodemailer');
const logger = require('./log');

const config = {
    emails: {
        to: process.env.ADMIN_MAIL,
        subject: "Новая оплата с donate.shpp.me"
    },
};

let transporter = nodemailer.createTransport({
  port: 587,
  host: process.env.SES_HOST,
  auth: {
    user: process.env.SES_USER,
    pass: process.env.SES_PASS
  }
}, {
  from: process.env.SES_FROM
});

module.exports.sendMail = (message, recipient = config.emails.to, subject = config.emails.subject) => {
  logger.info(`Going to send email... ${JSON.stringify({message, recipient, subject})}`);
  transporter.sendMail({
    to: recipient,
    subject,
    html: message
  }, (err, data) => {
    if(err) {
      logger.error(`Could not send email to ${recipient} ${JSON.stringify({err, subject})}`);
      return
    }
    logger.info(`Successfully sent mail! ${JSON.stringify(data)}` )
  })
};
