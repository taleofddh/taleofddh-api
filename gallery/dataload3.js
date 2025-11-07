import fs from 'fs';
import dotenv from 'dotenv';
import * as database from '@taleofddh/database';
import { v6 as uuidv6 } from 'uuid';

dotenv.config();

let albumKey = [];
let albumItem = [];
fs.readFile('data/album.json', 'utf8', async (err, data) => {
    let albumList = await JSON.parse(data);
    let docPromises = {};
    docPromises = albumList.map(async (item) => {
        //console.log(item);
        albumKey = {
            Key: {
                "name": item.name,
                "startDateTime": item.startDateTime
            }
        };
        await dbOperation("deleteItem", "gallery", albumKey);
        const options = {
            msecs: new Date(item.startDateTime).getTime()
        }
        albumItem = {
            Item: {
                "id": uuidv6(options),
                "category": item.category,
                "subCategory": item.subCategory,
                "name": item.name,
                "description": item.description,
                "titlePhoto": item.titlePhoto,
                "startDateTime": item.startDateTime,
                "endDateTime": item.endDateTime,
                "collection": item.collection,
                "restrictedFlag": item.restrictedFlag,
                "defaultFlag": item.defaultFlag,
                "viewCount": item.viewCount,
                "sequence": item.sequence,
                "photoCount": item.photoCount,
                "production": item.production,
                "searchName": item.name.toUpperCase(),
                "createDate": new Date().toDateString(),
                "updateDate": new Date().toDateString()
            }
        };
        await dbOperation("writeItem", "gallery", albumItem);
        return await dbOperation("getItem", "gallery", albumKey);
    });
    const docs = await Promise.all(docPromises);
    console.log(docs);
});

const dbOperation = async (operation, table, data) => {
    let tableName = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + table;
    let response;
    let params;
    try {
        switch(operation) {
            case 'getItem':
                data.TableName = tableName;
                params = data;
                response = await database.get(params);
                break;
            case 'getItems':
                params = {
                    "RequestItems": {
                        [tableName]: {
                            "Keys": data
                        }
                    }
                }
                response = await database.batchGet(params, tableName);
                break;
            case 'writeItem':
                data.TableName = tableName;
                params = data;
                response = await database.put(params);
                break;
            case 'writeItems':
                params = {
                    "RequestItems": {
                        [tableName]: data
                    }
                }
                response = await database.batchWrite(params);
                break;
            case 'updateItem':
                data.TableName = tableName;
                params = data;
                response = await database.update(params);
                break;
            case 'updateItems':
                params = {
                    "RequestItems": {
                        [tableName]: data
                    }
                }
                response = await database.batchWrite(params);
                break;
            case 'deleteItem':
                data.TableName = tableName;
                params = data;
                response = await database.deleteItem(params);
                break;
            case 'deleteItems':
                params = {
                    "RequestItems": {
                        [tableName]: data
                    }
                }
                response = await database.batchWrite(params);
                break;
            case 'queryItems':
                data.TableName = tableName
                params = data;
                response = await database.query(params);
                break;
            case 'scanItems':
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