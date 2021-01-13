'use strict';
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

    let message = await email.parse(object);
    message.messageId = sesNotification.mail.messageId;

    const params = {
        TableName: table,
        Item: message
    }
    const inboxMsg = await database.put(params);

    return {
        statusCode: 200,
        body: JSON.stringify(inboxMsg),
        status: 'success'
    };
}

module.exports.processStoredMessage = async (event) => {
    const data = JSON.parse(event.body);
    const prefix = data.prefix;
    // Retrieve the message from your bucket
    const messages = await storage.listFolder({Bucket: bucket, Delimiter: "/", Prefix: prefix + "/"});

    let processedMessageList = [];
    for(let i = 0; i < messages.length; i++) {
        let messageId = messages[i];
        let params = {
            TableName: table,
            Key: {
                "messageId": messageId
            }
        }
        let messageExists = await database.get(params);
        if(!messageExists) {
            const object = await storage.getObject({Bucket: bucket, Key: prefix + "/" + messageId});

            let message = await email.parse(object);
            message.messageId = messageId;

            const params = {
                TableName: table,
                Item: message
            }
            const inboxMsg = await database.put(params);
            console.log('Processed ' + messageId);
            processedMessageList.push(message);
        }
    }
    console.log("List", processedMessageList);
    return {
        statusCode: 200,
        body: JSON.stringify(processedMessageList),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
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
