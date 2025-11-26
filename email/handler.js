'use strict';
import * as email from '@taleofddh/email';
import * as response from '@taleofddh/response';

export const sendRequestMessage = async (event) => {
    const request = JSON.parse(event.body);
    const data = JSON.stringify({ "name" : request.name, "subject": request.subject, "number": request.number, "message": request.message });
    const messageId = await email.send(request.to, process.env['TEMPLATE_NAME'], data);
    return response.createResponse(messageId, 200);
};

export const sendSubscriptionMessage = async (event) => {
    const subscription = JSON.parse(event.body);
    const data = JSON.stringify({ "subject": subscription.subject });
    const messageId = await email.send(subscription.to, process.env['TEMPLATE_NAME'], data);
    return response.createResponse(messageId, 200);
};

export const sendPromotionMessage = async (event) => {
    const subscription = JSON.parse(event.body);
    const data = JSON.stringify({ "subject": subscription.subject, "message": subscription.message });
    const messageId = await email.send(subscription.to, process.env['TEMPLATE_NAME'], data);
    return response.createResponse(messageId, 200);
};