'use strict';
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

    db.insertDocument(database, collection, request);

    db.insertDocument(database, "auditTrail", auditTrail);

    return {
        statusCode: 200,
        body: JSON.stringify(request),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};
