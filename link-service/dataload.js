const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const dotenv = require('dotenv');
const database = require('./db');

dotenv.config();

let linkDeleteKeys = [];
let linkItems = [];
let linkGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'link.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        sequence: parseInt(data.sequence),
        name: data.name,
        link: data.link,
        external: data.external.toUpperCase() === 'TRUE',
        icon: data.icon,
        active: data.active.toUpperCase() === 'TRUE',
        summary: data.summary
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        linkDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "sequence": row.sequence
                }
            }
        });
        linkItems.push({
            PutRequest: {
                Item: {
                    "sequence": row.sequence,
                    "name": row.name,
                    "link": row.link,
                    "external": row.external,
                    "icon": row.icon,
                    "active": row.active,
                    "summary": row.summary
                }
            }
        });
        linkGetKeys.push({
            "sequence": row.sequence
        });
    })
    .on('end', async rowCount => {
        await dbOperation("deleteDocs", "link", linkDeleteKeys);
        await dbOperation("insertDocs", "link", linkItems);
        const docs = await dbOperation("findDocs", "link", linkGetKeys);
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

let visitStatusDeleteKeys = [];
let visitStatusItems = [];
let visitStatusGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'visitStatus.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        sequence: parseInt(data.sequence),
        status: data.status,
        color: data.color,
        backgroundColor: data.backgroundColor
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        visitStatusDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "sequence": row.sequence
                }
            }
        });
        visitStatusItems.push({
            PutRequest: {
                Item: {
                    "sequence": row.sequence,
                    "status": row.status,
                    "color": row.color,
                    "backgroundColor": row.backgroundColor
                }
            }
        });
        visitStatusGetKeys.push({
            "sequence": row.sequence
        });
    })
    .on('end', async rowCount => {
        await dbOperation("deleteDocs", "visitStatus", visitStatusDeleteKeys);
        await dbOperation("insertDocs", "visitStatus", visitStatusItems);
        const docs = await dbOperation("findDocs", "visitStatus", visitStatusGetKeys);
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

let countryVisitDeleteKeys = [];
let countryVisitItems = [];
let countryVisitGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'countryVisit.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        countryCode: data.countryCode,
        countryName: data.countryName,
        visitStatus: data.visitStatus
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        countryVisitDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "visitStatus": row.visitStatus,
                    "countryCode": row.countryCode
                }
            }
        });
        countryVisitItems.push({
            PutRequest: {
                Item: {
                    "countryCode": row.countryCode,
                    "countryName": row.countryName,
                    "visitStatus": row.visitStatus
                }
            }
        });
        countryVisitGetKeys.push({
            "visitStatus": row.visitStatus,
            "countryCode": row.countryCode
        });
    })
    .on('end', async rowCount => {
        const batchSize = 25;
        let len = countryVisitItems.length;
        for (let i = 0; i < len; i += batchSize) {
            let tempCountryVisitDeleteKeys = countryVisitDeleteKeys.slice(i, i + batchSize);
            await dbOperation("deleteDocs", "countryVisit", tempCountryVisitDeleteKeys);
            let tempCountryVisitItems = countryVisitItems.slice(i, i + batchSize);
            await dbOperation("insertDocs", "countryVisit", tempCountryVisitItems);
            let tempCountryVisitGetKeys = countryVisitGetKeys.slice(i, i + batchSize);
            const docs = await dbOperation("findDocs", "countryVisit", tempCountryVisitGetKeys);
            await console.log(docs);
        }
        await console.log(`Parsed ${rowCount} rows`);
    });

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