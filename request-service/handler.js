'use strict';
const fetch = require('node-fetch');
const db = require('./db');
const collection = process.env['COLLECTION_NAME'];

module.exports.createRequest = async (event) => {
    const database = await db.get();
    const data = JSON.parse(event.body);
    var typeDoc = await db.findDocument(database, "type", {"type": data.type});
    const type = typeDoc.type;
    const countryCode = (data.countryCode) ? data.countryCode : "";
    const requestor = data.requestor;
    const email = data.email;
    const phone = (data.phone) ? data.phone : "";
    const enquiry = data.enquiry;
    var sequenceDoc = await db.findSequence(database, "sequence", {"key": "request_seq"});
    const sequence = sequenceDoc.sequence + '';
    const number = 'REQ' + sequence.padStart(7, '0');
    var statusDoc = await db.findDocument(database, "status", {"status": "Submitted"});
    const status = statusDoc.status;
    const date = new Date();

    const actionDoc = await db.findDocument(database, "action", {"action": "Create Request"});
    const action = actionDoc.action;
    const message = actionDoc.description + " " + number;

    const request = {
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
        "updateDate": date,
        "commentList": [],
        "attachmentList": [],
        "auditTrailList": []
    }

    const auditTrail = {
        "number": number,
        "date": date,
        "user": requestor,
        "action": action,
        "message": message
    }

    const emailData = {
        "name" : requestor,
        "subject": "Your Enquiry",
        "number": number,
        "message": enquiry,
        "to": email
    };

    await db.insertDocument(database, collection, request);

    await db.insertDocument(database, "auditTrail", auditTrail);

    const sendMessage = await sendConfirmation(process.env['SEND_ENQUIRY_URL'], JSON.stringify(emailData));

    if (sendMessage.MessageId) {
        console.log("Attempted to send email to " + email + " for request # " + number);
    }

    return {
        statusCode: 200,
        body: JSON.stringify(request),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findRequest = async (event) => {
    const data = JSON.parse(event.body);
    const database = await db.get();
    const docs = await db.findDocument(database, collection, { "email" : data.email, "number": data.requestId });
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.updateSubscription = async (event) => {
    const data = JSON.parse(event.body);
    const database = await db.get();
    var existingSubscriptionDoc = await db.findDocument(database, collection, {"email": data.email});
    if(existingSubscriptionDoc) {
        const update = { "$set": { "subscribed": data.subscribed } };
        await db.updateDocument(database, collection, {"email": data.email}, update)
    } else {
        await db.insertDocument(database, collection, data);
    }

    const emailData = {
        "subject": "Acknowledgement",
        "to": data.email
    };

    const sendMessage = await sendConfirmation(process.env['SEND_SUBSCRIPTION_URL'], JSON.stringify(emailData));

    if (sendMessage.MessageId) {
        console.log("Attempted to send email to " + data.email + " for subscription option " + data.subscribed);
    }

    return {
        statusCode: 200,
        body: JSON.stringify(data),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
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
