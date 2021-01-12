const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const dotenv = require('dotenv');
const database = require('./db');
const hash = require('hash.js');

dotenv.config();

let photoDeleteKeys = [];
let photoItems = [];
let photoGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'photo.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        sequence: parseInt(data.sequence),
        albumName: data.albumName,
        name: data.name,
        hashedName: hash.sha256().update(data.name).digest('hex').toUpperCase(),
        date: data.date,
        description: data.description,
        maxWidth: parseInt(data.maxWidth),
        maxHeight: parseInt(data.maxHeight),
        path: data.path,
        viewCount: parseInt(data.viewCount),
        restrictedFlag: data.restrictedFlag.toUpperCase() === 'TRUE',
        pictureBoxFlag: data.pictureBoxFlag.toUpperCase() === 'TRUE',
        disabled: data.disabled.toUpperCase() === 'TRUE'
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        photoDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "albumName": row.albumName,
                    "name": row.name
                }
            }
        });
        photoItems.push({
            PutRequest: {
                Item: {
                    "sequence": row.sequence,
                    "albumName": row.albumName,
                    "name": row.name,
                    "hashedName": row.hashedName,
                    "date": row.date,
                    "description": row.description,
                    "maxWidth": row.maxWidth,
                    "maxHeight": row.maxHeight,
                    "path": row.path,
                    "viewCount": row.viewCount,
                    "restrictedFlag": row.restrictedFlag,
                    "pictureBoxFlag": row.pictureBoxFlag,
                    "disabled": row.disabled
                }
            }
        });
        photoGetKeys.push({
            "albumName": row.albumName,
            "name": row.name
        });
    })
    .on('end', async rowCount => {
        const batchSize = 25;
        let len = photoItems.length;
        for (let i = 0; i < len; i += batchSize) {
            let tempPhotoDeleteKeys = photoDeleteKeys.slice(i, i + batchSize);
            await dbOperation("deleteDocs", "photo", tempPhotoDeleteKeys);
            let tempPhotoItems = photoItems.slice(i, i + batchSize);
            await dbOperation("insertDocs", "photo", tempPhotoItems);
            let tempPhotoGetKeys = photoGetKeys.slice(i, i + batchSize);
            const docs = await dbOperation("findDocs", "photo", tempPhotoGetKeys);
            await console.log(docs);
        }
        const sequenceKey = {
            Item: {
                "key": "photo_seq",
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