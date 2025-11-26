import fs from 'fs';
import path from 'path';
import csv from 'fast-csv';
import dotenv from 'dotenv';
import * as database from '@taleofddh/database';
import * as storage from '@taleofddh/storage';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

let aboutUsObject = [];
fs.readFile('data/aboutUs.json', 'utf8', async (err, data) => {
    aboutUsObject = await JSON.parse(data);
    await storage.operation("deleteObject", "aboutUs");
    await storage.operation("putObject", "aboutUs", aboutUsObject);
    const object = await storage.operation("getObject", "aboutUs");
    console.log(await object.Body.transformToString());
});

let peopleKey = [];
let peopleItem = [];
fs.readFile('data/people.json', 'utf8', async (err, data) => {
    let peopleList = await JSON.parse(data);
    let docPromises = {};
    docPromises = peopleList.map(async (item) => {
        //console.log(item);
        peopleKey = {
            Key: {
                "communityCode": item.communityCode,
                "memberSince": item.memberSince
            }
        };
        await database.operation("deleteItem", "people", peopleKey);
        peopleItem = {
            Item: {
                "communityCode": item.communityCode,
                "type": item.type,
                "shortName": item.shortName,
                "members": item.members,
                "image": item.image,
                "memberSince": item.memberSince,
                "active": item.active
            }
        };
        await database.operation("writeItem", "people", peopleItem);
        const doc = await database.operation("getItem", "people", peopleKey);
        return doc;
    });
    const docs = await Promise.all(docPromises);
    console.log(docs);
});

let menuObject = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'menu.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        sequence: parseInt(data.sequence),
        name: data.name,
        type: data.type,
        link: data.link,
        icon: data.icon,
        condition: data.condition,
        active: data.active.toUpperCase() === 'TRUE',
        roleCode: data.roleCode
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        menuObject.push({
            "sequence": row.sequence,
            "name": row.name,
            "type": row.type,
            "link": row.link,
            "icon": row.icon,
            "condition": row.condition,
            "active": row.active,
            "roleCode": row.roleCode
        });
    })
    .on('end', async rowCount => {
        await storage.operation("deleteObject", "menu");
        await storage.operation("putObject", "menu", menuObject);
        const object = await storage.operation("getObject", "menu");
        console.log(await object.Body.transformToString());
        console.log(`Parsed ${rowCount} rows`);
    });


