const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const dotenv = require('dotenv');
const database = require('./db');

dotenv.config();

let actionDeleteKeys = [];
let actionItems = [];
let actionGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'action.csv'))
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
        await dbOperation("deleteDocs", "action", actionDeleteKeys);
        await dbOperation("insertDocs", "action", actionItems);
        const docs = await dbOperation("findDocs", "action", actionGetKeys);
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

let statusDeleteKeys = [];
let statusItems = [];
let statusGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'status.csv'))
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
        await dbOperation("deleteDocs", "status", statusDeleteKeys);
        await dbOperation("insertDocs", "status", statusItems);
        const docs = await dbOperation("findDocs", "status", statusGetKeys);
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

let typeDeleteKeys = [];
let typeItems = [];
let typeGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'type.csv'))
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
        await dbOperation("deleteDocs", "type", typeDeleteKeys);
        await dbOperation("insertDocs", "type", typeItems);
        const docs = await dbOperation("findDocs", "type", typeGetKeys);
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
        await dbOperation("deleteDocs", "subscription", subscriptionDeleteKeys);
        await dbOperation("insertDocs", "subscription", subscriptionItems);
        const docs = await dbOperation("findDocs", "subscription", subscriptionGetKeys);
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
        await dbOperation("deleteDocs", "auditTrail", auditTrailDeleteKeys);
        await dbOperation("insertDocs", "auditTrail", auditTrailItems);
        const docs = await dbOperation("findDocs", "auditTrail", auditTrailGetKeys);
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
            await dbOperation("deleteDocs", "request", tempRequestDeleteKeys);
            let tempRequestItems = requestItems.slice(i, i + batchSize);
            await dbOperation("insertDocs", "request", tempRequestItems);
            let tempRequestGetKeys = requestGetKeys.slice(i, i + batchSize);
            const docs = await dbOperation("findDocs", "request", tempRequestGetKeys);
            await console.log(docs);
        }
        const sequenceKey = {
            Item: {
                "key": "request_seq",
                "sequence": rowCount
            }
        }
        await dbOperation("updateDoc", "sequence", sequenceKey);
        await console.log(`Parsed ${rowCount} rows`);
    });*/

const dbOperation = async (operation, table, data, filter) => {
    var tableName = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + table;
    var response;
    var params;
    try {
        switch(operation) {
            case 'findDoc':
                data.TableName = tableName;
                params = data;
                response = await database.get(params);
                break;
            case 'findDocs':
                params = {
                    "RequestItems": {
                        [tableName]: {
                            "Keys": data
                        }
                    }
                }
                response = await database.batchGet(params, tableName);
                break;
            case 'insertDoc':
                data.TableName = tableName;
                params = data;
                response = await database.put(params);
                break;
            case 'insertDocs':
                params = {
                    "RequestItems": {
                        [tableName]: data
                    }
                }
                response = await database.batchWrite(params);
                break;
            case 'updateDoc':
                data.TableName = tableName;
                params = data;
                response = await database.put(params);
                break;
            case 'udpateDocs':
                params = {
                    "RequestItems": {
                        [tableName]: data
                    }
                }
                response = await database.batchWrite(params);
                break;
            case 'deleteDoc':
                data.TableName = tableName;
                params = data;
                response = await database.delete(params);
                break;
            case 'deleteDocs':
                params = {
                    "RequestItems": {
                        [tableName]: data
                    }
                }
                response = await database.batchWrite(params);
                break;
            case 'queryDocs':
                filter.TableName = tableName
                params = filter;
                response = await database.query(params);
                break;
            case 'scanDocs':
                filter.TableName = tableName
                params = filter;
                response = await database.scan(params);
                break;
            case 'putDoc':
                data.TableName = tableName
                params = data;
                response = await database.putDocument(params);
                break;
            default:
                break;
        }
        return response;
    } catch (error) {
        console.error(error);
    }
}