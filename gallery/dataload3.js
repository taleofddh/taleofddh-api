import fs from 'fs';
import dotenv from 'dotenv';
import * as database from '@taleofddh/database';
import { v6 as uuidv6 } from 'uuid';

dotenv.config();

let galleryKey = [];
let galleryItem = [];
fs.readFile('data/gallery.json', 'utf8', async (err, data) => {
    let galleryList = await JSON.parse(data);
    let docPromises = {};
    docPromises = galleryList.map(async (item) => {
        //console.log(item);
        galleryKey = {
            Key: {
                "name": item.name,
                "startDateTime": item.startDateTime
            }
        };
        await database.operation("deleteItem", "gallery", galleryKey);
        const options = {
            msecs: new Date(item.startDateTime).getTime()
        }
        galleryItem = {
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
                "photoCount": item.photoCount,
                "production": item.production,
                "searchName": item.name.toUpperCase(),
                "createDate": new Date().toDateString(),
                "updateDate": new Date().toDateString()
            }
        };
        await database.operation("writeItem", "gallery", galleryItem);
        return await database.operation("getItem", "gallery", galleryKey);
    });
    const docs = await Promise.all(docPromises);
    console.log(docs);
});
