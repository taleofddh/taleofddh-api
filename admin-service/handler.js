'use strict';
const db = require('./db');
const storage = require('./storage');
const email = require('./email');
const database = require('./db');
const table = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + process.env['TABLE_NAME'];
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
    const params = {
        TableName: table,
        Item: {
            "messageId": message.messaageId,
            "from": message.from,
            "date": message.date,
            "to": message.to,
            "cc": message.cc,
            "subject": message.subject,
            "body": message.body
        }
    }
    const email = await database.put(params);

    return {
        statusCode: 200,
        body: JSON.stringify(email),
        status: 'success'
    };
}

module.exports.findMessageList = async (event) => {
    const data = JSON.parse(event.body);
    const prefix = data.prefix;
    const messages = await storage.listFolder({Bucket: bucket, Delimiter: "/", Prefix: prefix + "/"});
    return {
        statusCode: 200,
        body: JSON.stringify(messages),
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
