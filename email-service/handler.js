'use strict';
const email = require('./email');

module.exports.sendEnquiryMessage = async (event) => {
    const enquiry = JSON.parse(event.body);
    const data = JSON.stringify({ "name" : enquiry.name, "subject": enquiry.subject, "number": enquiry.number, "message": enquiry.message });
    const messageId = await email.send(enquiry.to, process.env['TEMPLATE_NAME'], data);
    return {
        statusCode: 200,
        body: JSON.stringify(messageId),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.sendSubscriptionMessage = async (event) => {
    const subscription = JSON.parse(event.body);
    const data = JSON.stringify({ "subject": subscription.subject });
    const messageId = await email.send(subscription.to, process.env['TEMPLATE_NAME'], data);
    return {
        statusCode: 200,
        body: JSON.stringify(messageId),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};