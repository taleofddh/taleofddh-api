import fs from 'fs';
import path from 'path';
import csv from 'fast-csv';
import dotenv from 'dotenv';
import * as database from '@taleofddh/database';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
            const titleDoc = await database.operation("findDoc", "photo", titleKey);
            albumItems[i].PutRequest.Item.titlePhoto = titleDoc;
        }
        const batchSize = 25;
        let len = albumItems.length;
        for (let i = 0; i < len; i += batchSize) {
            let tempAlbumDeleteKeys = albumDeleteKeys.slice(i, i + batchSize);
            await database.operation("deleteDocs", "album", tempAlbumDeleteKeys);
            let tempAlbumItems = albumItems.slice(i, i + batchSize);
            await database.operation("insertDocs", "album", tempAlbumItems);
            let tempAlbumGetKeys = albumGetKeys.slice(i, i + batchSize);
            const docs = await database.operation("findDocs", "album", tempAlbumGetKeys);
            await console.log(docs);
        }
        const sequenceKey = {
            Item: {
                "key": "album_seq",
                "squence": rowCount
            }
        }
        await database.operation("updateDoc", "sequence", sequenceKey);
        await console.log(`Parsed ${rowCount} rows`);
    });
