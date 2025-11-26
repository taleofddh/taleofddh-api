import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'fast-csv';
import dotenv from 'dotenv';
import * as database from '@taleofddh/database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        await database.operation("deleteDocs", "user", userDeleteKeys);
        for(let i in userItems) {
            const params = {
                Key: {
                    number: userItems[i].PutRequest.Item.userProfile
                }
            }
            userItems[i].PutRequest.Item.userProfile = await database.operation("findDoc", "userProfile", params);
        }
        await database.operation("insertDocs", "user", userItems);
        const docs = await database.operation("findDocs", "user", userGetKeys);
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
        await database.operation("deleteDocs", "userRole", userRoleDeleteKeys);
        await database.operation("insertDocs", "userRole", userRoleItems);
        const docs = await database.operation("findDocs", "userRole", userRoleGetKeys);
        await console.log(docs);
        const sequenceKey = {
            Item: {
                "key": "userRole_seq",
                "sequence": rowCount
            }
        }
        await database.operation("updateDoc", "sequence", sequenceKey);
        await console.log(`Parsed ${rowCount} rows`);
    });
