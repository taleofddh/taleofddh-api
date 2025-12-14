import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'fast-csv';
import dotenv from 'dotenv';
import * as database from '@taleofddh/database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        await database.operation("deleteItems", "link", linkDeleteKeys);
        await database.operation("writeItems", "link", linkItems);
        const docs = await database.operation("getItems", "link", linkGetKeys);
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
        await database.operation("deleteItems", "visitStatus", visitStatusDeleteKeys);
        await database.operation("writeItems", "visitStatus", visitStatusItems);
        const docs = await database.operation("getItems", "visitStatus", visitStatusGetKeys);
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
            await database.operation("deleteItems", "countryVisit", tempCountryVisitDeleteKeys);
            let tempCountryVisitItems = countryVisitItems.slice(i, i + batchSize);
            await database.operation("writeItems", "countryVisit", tempCountryVisitItems);
            let tempCountryVisitGetKeys = countryVisitGetKeys.slice(i, i + batchSize);
            const docs = await database.operation("getItems", "countryVisit", tempCountryVisitGetKeys);
            await console.log(docs);
        }
        await console.log(`Parsed ${rowCount} rows`);
    });
