import fs from 'fs';
import path from 'path';
import csv from 'fast-csv';
import dotenv from 'dotenv';
import * as database from '@taleofddh/database';

dotenv.config();

let actionDeleteKeys = [];
let actionItems = [];
let actionGetKeys = [];
fs.createReadStream(path.resolve(process.cwd(), 'request', 'data', 'action.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        action: data.action,
        description: data.description
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        actionDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "action": row.action
                }
            }
        });
        actionItems.push({
            PutRequest: {
                Item: {
                    "action": row.action,
                    "description": row.description
                }
            }
        });
        actionGetKeys.push({
            "action": row.action
        });
    })
    .on('end', async rowCount => {
        await database.operation("deleteDocs", "action", actionDeleteKeys);
        await database.operation("insertDocs", "action", actionItems);
        const docs = await database.operation("findDocs", "action", actionGetKeys);
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

let statusDeleteKeys = [];
let statusItems = [];
let statusGetKeys = [];
fs.createReadStream(path.resolve(process.cwd(), 'request', 'data', 'status.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        status: data.status,
        description: data.description
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        statusDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "status": row.status
                }
            }
        });
        statusItems.push({
            PutRequest: {
                Item: {
                    "status": row.status,
                    "description": row.description
                }
            }
        });
        statusGetKeys.push({
            "status": row.status
        });
    })
    .on('end', async rowCount => {
        await database.operation("deleteDocs", "status", statusDeleteKeys);
        await database.operation("insertDocs", "status", statusItems);
        const docs = await database.operation("findDocs", "status", statusGetKeys);
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

let typeDeleteKeys = [];
let typeItems = [];
let typeGetKeys = [];
fs.createReadStream(path.resolve(process.cwd(), 'request', 'data', 'type.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        type: data.type,
        description: data.description
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        typeDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "type": row.type
                }
            }
        });
        typeItems.push({
            PutRequest: {
                Item: {
                    "type": row.type,
                    "description": row.description
                }
            }
        });
        typeGetKeys.push({
            "type": row.type
        });
    })
    .on('end', async rowCount => {
        await database.operation("deleteDocs", "type", typeDeleteKeys);
        await database.operation("insertDocs", "type", typeItems);
        const docs = await database.operation("findDocs", "type", typeGetKeys);
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

/*let subscriptionDeleteKeys = [];
let subscriptionItems = [];
let subscriptionGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'subscription.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        email: data.email,
        subscribed: data.subscribed
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        subscriptionDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "email": row.email
                }
            }
        });
        subscriptionItems.push({
            PutRequest: {
                Item: {
                    "email": row.email,
                    "subscribed": row.subscribed
                }
            }
        });
        subscriptionGetKeys.push({
            "email": row.email
        });
    })
    .on('end', async rowCount => {
        await database.operation("deleteDocs", "subscription", subscriptionDeleteKeys);
        await database.operation("insertDocs", "subscription", subscriptionItems);
        const docs = await database.operation("findDocs", "subscription", subscriptionGetKeys);
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

let auditTrailDeleteKeys = [];
let auditTrailItems = [];
let auditTrailGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'auditTrail.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        number: data.number,
        date: data.date,
        user: data.user,
        action: data.action,
        message: data.message
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        auditTrailDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "number": row.number,
                    "date": row.date
                }
            }
        });
        auditTrailItems.push({
            PutRequest: {
                Item: {
                    "number": row.number,
                    "date": row.date,
                    "user": row.user,
                    "action": row.action,
                    "message": row.message
                }
            }
        });
        auditTrailGetKeys.push({
            "number": row.number,
            "date": row.date
        });
    })
    .on('end', async rowCount => {
        await database.operation("deleteDocs", "auditTrail", auditTrailDeleteKeys);
        await database.operation("insertDocs", "auditTrail", auditTrailItems);
        const docs = await database.operation("findDocs", "auditTrail", auditTrailGetKeys);
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

let requestDeleteKeys = [];
let requestItems = [];
let requestGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'request.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        type: data.type,
        countryCode: data.countryCode,
        sequnce: parseInt(data.sequence),
        number: data.number,
        requestor: data.requestor,
        email: data.email,
        phone: data.phone,
        enquiry: data.enquiry,
        status: data.staus,
        createDate: data.createDate,
        updateDate: data.updateDate
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        requestDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "number": row.number,
                    "email": row.email
                }
            }
        });
        requestItems.push({
            PutRequest: {
                Item: {
                    "type": row.type,
                    "countryCode": row.countryCode,
                    "sequnce": row.sequence,
                    "number": row.number,
                    "requestor": row.requestor,
                    "email": row.email,
                    "phone": row.phone,
                    "enquiry": row.enquiry,
                    "status": row.staus,
                    "createDate": row.createDate,
                    "updateDate": row.updateDate
                }
            }
        });
        requestGetKeys.push({
            "number": row.number,
            "email": row.email
        });
    })
    .on('end', async rowCount => {
        const batchSize = 25;
        let len = requestItems.length;
        for (let i = 0; i < len; i += batchSize) {
            let tempRequestDeleteKeys = requestDeleteKeys.slice(i, i + batchSize);
            await database.operation("deleteDocs", "request", tempRequestDeleteKeys);
            let tempRequestItems = requestItems.slice(i, i + batchSize);
            await database.operation("insertDocs", "request", tempRequestItems);
            let tempRequestGetKeys = requestGetKeys.slice(i, i + batchSize);
            const docs = await database.operation("findDocs", "request", tempRequestGetKeys);
            await console.log(docs);
        }
        const sequenceKey = {
            Item: {
                "key": "request_seq",
                "sequence": rowCount
            }
        }
        await database.operation("updateDoc", "sequence", sequenceKey);
        await console.log(`Parsed ${rowCount} rows`);
    });*/
