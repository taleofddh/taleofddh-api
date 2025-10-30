import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'fast-csv';
import dotenv from 'dotenv';
import * as database from '@taleofddh/database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

let communityDeleteKeys = [];
let communityItems = [];
let communityGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'community.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        number: parseInt(data.number),
        name: data.name
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        communityDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "name": row.name
                }
            }
        });
        communityItems.push({
            PutRequest: {
                Item: {
                    "number": row.number,
                    "name": row.name
                }
            }
        });
        communityGetKeys.push({
            "name": row.name
        });
    })
    .on('end', async rowCount => {
        await dbOperation("deleteDocs", "community", communityDeleteKeys);
        await dbOperation("insertDocs", "community", communityItems);
        const docs = await dbOperation("findDocs", "community", communityGetKeys);
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

let roleDeleteKeys = [];
let roleItems = [];
let roleGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'role.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        number: parseInt(data.number),
        name: data.name
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        roleDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "name": row.name
                }
            }
        });
        roleItems.push({
            PutRequest: {
                Item: {
                    "number": row.number,
                    "name": row.name
                }
            }
        });
        roleGetKeys.push({
            "name": row.name
        });
    })
    .on('end', async rowCount => {
        await dbOperation("deleteDocs", "role", roleDeleteKeys);
        await dbOperation("insertDocs", "role", roleItems);
        const docs = await dbOperation("findDocs", "role", roleGetKeys);
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

const dbOperation = async (operation, table, data) => {
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
                data.TableName = tableName
                params = data;
                response = await database.query(params);
                break;
            case 'scanDocs':
                data.TableName = tableName
                params = data;
                response = await database.scan(params);
                break;
            default:
                break;
        }
        return response;
    } catch (error) {
        console.error(error);
    }
}