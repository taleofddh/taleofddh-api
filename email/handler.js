'use strict';
const email = require('./email');

module.exports.sendRequestMessage = async (event) => {
    const request = JSON.parse(event.body);
    const data = JSON.stringify({ "name" : request.name, "subject": request.subject, "number": request.number, "message": request.message });
    const messageId = await email.send(request.to, process.env['TEMPLATE_NAME'], data);
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

module.exports.sendPromotionMessage = async (event) => {
    const subscription = JSON.parse(event.body);
    const data = JSON.stringify({ "subject": subscription.subject, "message": subscription.message });
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