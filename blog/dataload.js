import fs from 'fs';
import dotenv from 'dotenv';
import * as database from '@taleofddh/database';
import {v6 as uuidv6} from 'uuid';

dotenv.config();

let blogKey = [];
let blogItem = [];
fs.readFile('data/blog.json', 'utf8', async (err, data) => {
    let blogList = await JSON.parse(data);
    let docPromises = {};
    docPromises = blogList.map(async (item) => {
        //console.log(item);
        blogKey = {
            Key: {
                "name": item.name,
                "startDateTime": item.startDateTime
            }
        };
        await database.operation("deleteItem", "blog", blogKey);
        const options = {
            msecs: new Date(item.startDateTime).getTime()
        }
        blogItem = {
            Item: {
                "id": uuidv6(options),
                "category": item.category,
                "name": item.name,
                "header": item.header,
                "titlePhoto": item.titlePhoto,
                "startDateTime": item.startDateTime,
                "endDateTime": item.endDateTime,
                "viewCount": item.viewCount,
                "summary": item.summary,
                "homePageFlag": item.homePageFlag,
                "link": item.link,
                "author": item.author,
                "title": item.title,
                "contents": item.contents,
                "searchName": item.name.toUpperCase()
            }
        };
        await database.operation("writeItem", "blog", blogItem);
        return await database.operation("getItem", "blog", blogKey);
    });
    const docs = await Promise.all(docPromises);
    console.log(docs);
});