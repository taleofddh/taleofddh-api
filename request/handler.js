'use strict';
import fetch from 'node-fetch';
import * as database from '@taleofddh/database';
import * as response from '@taleofddh/response';
const table = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + process.env['TABLE_NAME'];

export const createRequest = async (event) => {
    const data = JSON.parse(event.body);
    let params = {
        TableName: process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + 'type',
        Key: {
            "type": data.type
        }
    };
    const typeDoc = await database.get(params);
    const type = typeDoc.type;
    const countryCode = (data.countryCode) ? data.countryCode : "";
    const requestor = data.requestor;
    const email = data.email;
    const phone = (data.phone) ? data.phone : "";
    const enquiry = data.enquiry;
    params = {
        TableName: process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + 'sequence',
        Key: {
            "key": "request_seq"
        },
        UpdateExpression: "SET #sequence = #sequence + :inc",
        ExpressionAttributeNames: {
            "#sequence": "sequence"
        },
        ExpressionAttributeValues: { ":inc": 1 },
        ReturnValues: "ALL_NEW"
    }
    var sequenceDoc = await database.update(params);
    const sequence = sequenceDoc.sequence + '';
    const number = 'REQ' + sequence.padStart(7, '0');

    params = {
        TableName: process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + 'status',
        Key: {
            "status": "Submitted"
        }
    };
    var statusDoc = await database.get(params);
    const status = statusDoc.status;

    const date = JSON.parse(JSON.stringify(new Date()));

    params = {
        TableName: process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + 'action',
        Key: {
            "action": "Create Request"
        }
    };
    const actionDoc = await database.get(params);
    const action = actionDoc.action;

    const message = actionDoc.description + " " + number;

    const request = {
        TableName: table,
        Item: {
            "type": type,
            "countryCode": countryCode,
            "sequence": sequence,
            "number": number,
            "requestor": requestor,
            "email": email,
            "phone": phone,
            "enquiry": enquiry,
            "status": status,
            "createDate": date,
            "updateDate": date
        }
    }
    const auditTrail = {
        TableName: process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + 'auditTrail',
        Item: {
            "number": number,
            "date": date,
            "user": requestor,
            "action": action,
            "message": message
        }
    }

    const emailData = {
        "name" : requestor,
        "subject": "Your Enquiry",
        "number": number,
        "message": enquiry,
        "to": email
    };

    await database.put(request);

    await database.put(auditTrail);

    const sendMessage = await sendConfirmation(process.env['SEND_ENQUIRY_URL'], JSON.stringify(emailData));

    if (sendMessage.MessageId) {
        console.log("Attempted to send email to " + email + " for request # " + number);
    }

    return response.createResponse(request.Item, 200);
};

export const findRequest = async (event) => {
    const data = JSON.parse(event.body);
    const params = {
        TableName: table,
        Key: {
            'number': data.requestId,
            'email': data.email
        }
    };
    const request = await database.get(params);
    return response.createResponse(request, 200);
};

export const updateSubscription = async (event) => {
    const data = JSON.parse(event.body);
    const params = {
        TableName: table,
        Key: {
            "email": data.email
        },
        UpdateExpression: "SET #subscribed = :subscribed",
        ExpressionAttributeNames: {
            "#subscribed": "subscribed"
        },
        ExpressionAttributeValues: { ":subscribed": data.subscribed },
        ReturnValues: "UPDATED_NEW"
    }
    await database.update(params);

    const emailData = {
        "subject": "Acknowledgement",
        "to": data.email
    };

    const sendMessage = await sendConfirmation(process.env['SEND_SUBSCRIPTION_URL'], JSON.stringify(emailData));

    if (sendMessage.MessageId) {
        console.log("Attempted to send email to " + data.email + " for subscription option " + data.subscribed);
    }

    return response.createResponse(data, 200);
};

const sendConfirmation = async (url, data) => {
    const headers = {
        "Content-Type": "application/json"
    };

    // for async it only works with Promise and resolve/reject
    return new Promise( async (resolve, reject) => {
        try {
            const response = await fetch(url, { method: 'POST', headers: headers, body: data});
            const json = await response.json();
            resolve(json);
        } catch (error) {
            reject(error);
        }
    });
}
