'use strict';
const db = require('./db');
const storage = require('./storage');
const email = require('./email');
const collection = process.env['COLLECTION_NAME'];
const bucket = process.env['S3_BUCKET'];

module.exports.processInboundMessage = async (event) => {
    const prefix = "Inbox";
    console.log('Process email');
    var sesNotification = event.Records[0].ses;
    console.log("SES Notification:\n", JSON.stringify(sesNotification, null, 2));
    // Retrieve the email from your bucket
    const object = await storage.getObject({Bucket: bucket, Key: prefix + "/" + sesNotification.mail.messageId});

    const message = await email.parse(object);
    message.messaageId = sesNotification.mail.messageId;

    const database = await db.get();
    await db.insertDocument(database, collection, message);

    return {
        statusCode: 200,
        status: 'success'
    };
}

module.exports.findMessageList = async (event) => {
    const data = JSON.parse(event.body);
    const prefix = data.prefix;
    const docs = await storage.listFolder({Bucket: bucket, Delimiter: "/", Prefix: prefix + "/"});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
}

module.exports.getEmailMessage = async (event) => {
    const data = JSON.parse(event.body);
    const prefix = data.prefix;
    const file = data.file;
    let object = await storage.getObject({Bucket: bucket, Key: prefix + "/" + file});
    return {
        isBase64Encoded: true,
        statusCode: 200,
        body: JSON.stringify(object.Body.toString('base64')),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
            "Content-Type": object.ContentType,
            "Content-Disposition": "attachment; filename=" + file,
        }
    };
}
