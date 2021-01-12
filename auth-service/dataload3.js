const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const dotenv = require('dotenv');
const database = require('./db');

dotenv.config();

let userDeleteKeys = [];
let userItems = [];
let userGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'user.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        number: parseInt(data.number),
        username: data.username,
        password: data.password,
        userProfile: parseInt(data.userProfile)
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        userDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "username": row.username,
                    "password": row.password
                }
            }
        });
        userItems.push({
            PutRequest: {
                Item: {
                    "number": row.number,
                    "username": row.username,
                    "password": row.password,
                    "userProfile": row.userProfile
                }
            }
        });
        userGetKeys.push({
            "username": row.username,
            "password": row.password
        });
    })
    .on('end', async rowCount => {
        await dbOperation("deleteDocs", "user", userDeleteKeys);
        for(let i in userItems) {
            const params = {
                Key: {
                    number: userItems[i].PutRequest.Item.userProfile
                }
            }
            userItems[i].PutRequest.Item.userProfile = await dbOperation("findDoc", "userProfile", params);
        }
        await dbOperation("insertDocs", "user", userItems);
        const docs = await dbOperation("findDocs", "user", userGetKeys);
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

let userRoleDeleteKeys = [];
let userRoleItems = [];
let userRoleGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'userRole.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        number: parseInt(data.number),
        userNumber: parseInt(data.userNumber),
        roleList: JSON.parse(data.roleList)
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        userRoleDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "userNumber": row.userNumber
                }
            }
        });
        userRoleItems.push({
            PutRequest: {
                Item: {
                    "number": row.number,
                    "userNumber": row.userNumber,
                    "roleList": row.roleList
                }
            }
        });
        userRoleGetKeys.push({
            "userNumber": row.userNumber
        });
    })
    .on('end', async rowCount => {
        await dbOperation("deleteDocs", "userRole", userRoleDeleteKeys);
        await dbOperation("insertDocs", "userRole", userRoleItems);
        const docs = await dbOperation("findDocs", "userRole", userRoleGetKeys);
        await console.log(docs);
        const sequenceKey = {
            Item: {
                "key": "userRole_seq",
                "squence": rowCount
            }
        }
        await dbOperation("updateDoc", "sequence", sequenceKey);
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