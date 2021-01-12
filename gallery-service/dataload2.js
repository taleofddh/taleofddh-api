const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const dotenv = require('dotenv');
const database = require('./db');

dotenv.config();

let albumDeleteKeys = [];
let albumItems = [];
let albumGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'album.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        sequence: parseInt(data.sequence),
        collectionName: parseInt(data.collectionName),
        name: data.name,
        photoCount: parseInt(data.photoCount),
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description,
        titlePhoto: data.titlePhoto,
        viewCount: parseInt(data.viewCount),
        defaultFlag: data.defaultFlag.toUpperCase() === 'TRUE',
        restrictedFlag: data.restrictedFlag.toUpperCase() === 'TRUE'
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        albumDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "name": row.name
                }
            }
        });
        albumItems.push({
            PutRequest: {
                Item: {
                    "sequence": row.sequence,
                    "collectionName": row.collectionName,
                    "name": row.name,
                    "photoCount": row.photoCount,
                    "startDate": row.startDate,
                    "endDate": row.endDate,
                    "description": row.description,
                    "titlePhoto": row.titlePhoto,
                    "viewCount": row.viewCount,
                    "defaultFlag": row.restrictedFlag,
                    "restrictedFlag": row.restrictedFlag
                }
            }
        });
        albumGetKeys.push({
            "name": row.name
        });
    })
    .on('end', async rowCount => {
        for(let i in albumItems) {
            const titleKey = {
                Key: {
                    'albumName': albumItems[i].PutRequest.Item.name,
                    'name': albumItems[i].PutRequest.Item.titlePhoto
                }
            }
            const titleDoc = await dbOperation("findDoc", "photo", titleKey);
            albumItems[i].PutRequest.Item.titlePhoto = titleDoc;
        }
        const batchSize = 25;
        let len = albumItems.length;
        for (let i = 0; i < len; i += batchSize) {
            let tempAlbumDeleteKeys = albumDeleteKeys.slice(i, i + batchSize);
            await dbOperation("deleteDocs", "album", tempAlbumDeleteKeys);
            let tempAlbumItems = albumItems.slice(i, i + batchSize);
            await dbOperation("insertDocs", "album", tempAlbumItems);
            let tempAlbumGetKeys = albumGetKeys.slice(i, i + batchSize);
            const docs = await dbOperation("findDocs", "album", tempAlbumGetKeys);
            await console.log(docs);
        }
        const sequenceKey = {
            Item: {
                "key": "album_seq",
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
                //response = await database.collection(collection).updateOne(query, data);
                break;
            case 'udpateDocs':
                //response = await database.collection(collection).updateMany(query, data);
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