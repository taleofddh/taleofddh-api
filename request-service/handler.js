'use strict';
const fetch = require('node-fetch');
const db = require('./db');
const collection = process.env['COLLECTION_NAME'];

module.exports.createEnquiry = async (event) => {
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

    const sendMessage = await sendEnquiry(JSON.stringify(emailData));

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

const sendEnquiry = async (data) => {
    const url = process.env['SEND_ENQUIRY_URL'];
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
