'use strict';
import { getCaller, loadRolePermissionsFromTable, requirePermission } from '@taleofddh/auth';
import * as database from '@taleofddh/database';
import * as storage from '@taleofddh/storage';
import * as secret from '@taleofddh/secret';
import * as response from '@taleofddh/response';
import * as email from '@taleofddh/email';
const table = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + process.env['TABLE_NAME'];
const bucket = process.env['S3_BUCKET'];

export const processInboundMessage = async (event) => {
    const prefix = "Inbox";
    console.log('Process email');
    let sesNotification = event.Records[0].ses;
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

export const processStoredMessage = async (event) => {
    try {
        await requirePermission(event, 'messages:processStoredMessage');
    } catch (error) {
        return response.createErrorResponse(error.message, error.statusCode || 500);
    }
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

export const findMessageList = async (event) => {
    try {
        await requirePermission(event, 'messages:findMessageList');
    } catch (error) {
        return response.createErrorResponse(error.message, error.statusCode || 500);
    }
    const data = JSON.parse(event.body);
    const folder = data.folder;

    const params = {
        TableName: process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + folder.toLowerCase()
    }
    const messages = await database.scan(params);

    if(messages.length > 0 ) {
        messages.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return {
        statusCode: 200,
        body: JSON.stringify(messages),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
}

export const getEmailMessage = async (event) => {
    try {
        await requirePermission(event, 'messages:getEmailMessage');
    } catch (error) {
        return response.createErrorResponse(error.message, error.statusCode || 500);
    }
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
/**
 * Permissions the signed-in user holds in this service, from this service's rolePermissions table.
 * Display-only, for the UI; every endpoint still enforces its permission with requirePermission.
 * A "*" row is returned as "messages:*" so it can't be read as access to other services.
 */
export const findPermissions = async (event) => {
    let caller;
    let rolePermissions;
    try {
        caller = getCaller(event);
        rolePermissions = await loadRolePermissionsFromTable();
    } catch (error) {
        if (error.statusCode === 401) {
            return response.createErrorResponse(error.message, 401);
        }
        console.error('findPermissions failed', error);
        return response.createErrorResponse('Role permissions are unavailable', 500);
    }
    const permissions = new Set();
    for (const group of caller.groups) {
        for (const permission of rolePermissions.get(group) || []) {
            permissions.add(permission === '*' ? 'messages:*' : permission);
        }
    }
    return response.createResponse({ permissions: [...permissions].sort() }, 200);
}
