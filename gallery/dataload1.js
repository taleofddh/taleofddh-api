import fs from 'fs';
import path from 'path';
import csv from 'fast-csv';
import dotenv from 'dotenv';
import * as database from '@taleofddh/database';
import hash from 'hash.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
            await database.operation("deleteDocs", "photo", tempPhotoDeleteKeys);
            let tempPhotoItems = photoItems.slice(i, i + batchSize);
            await database.operation("insertDocs", "photo", tempPhotoItems);
            let tempPhotoGetKeys = photoGetKeys.slice(i, i + batchSize);
            const docs = await database.operation("findDocs", "photo", tempPhotoGetKeys);
            await console.log(docs);
        }
        const sequenceKey = {
            Item: {
                "key": "photo_seq",
                "squence": rowCount
            }
        }
        await database.operation("updateDoc", "sequence", sequenceKey);
        await console.log(`Parsed ${rowCount} rows`);
    });
