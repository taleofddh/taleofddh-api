import fs from 'fs';
import path from 'path';
import csv from 'fast-csv';
import dotenv from 'dotenv';
import * as database from '@taleofddh/database';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

let blogDeleteKeys = [];
let blogItemKeys = [];
let blogGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'blog.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        sequence: parseInt(data.sequence),
        name: data.name,
        author: data.author,
        category: data.category,
        startDate: data.startDate,
        endDate: data.endDate,
        homePageFlag: data.homePageFlag.toUpperCase() === 'TRUE',
        header: data.header,
        title: data.title,
        summary: data.summary,
        link: data.link,
        titlePhoto: data.titlePhoto,
        viewCount: parseInt(data.viewCount)
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        blogDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "name": row.name,
                    "category": row.category
                }
            }
        });
        blogItemKeys.push({
            PutRequest: {
                Item: {
                    "sequence": row.sequence,
                    "name": row.name,
                    "author": row.author,
                    "category": row.category,
                    "startDate": row.startDate,
                    "endDate": row.endDate,
                    "homePageFlag": row.homePageFlag,
                    "header": row.header,
                    "title": row.title,
                    "summary": row.summary,
                    "link": row.link,
                    "titlePhoto": row.titlePhoto,
                    "viewCount": row.viewCount
                }
            }
        });
        blogGetKeys.push({
            "name": row.name,
            "category": row.category
        });
    })
    .on('end', async rowCount => {
        await database.operation("deleteDocs", "blog", blogDeleteKeys);
        await database.operation("insertDocs", "blog", blogItemKeys);
        const docs = await database.operation("findDocs", "blog", blogGetKeys);
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

let articleDeleteKeys = [];
let articleItemKeys = [];
let articleGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'article.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        sequence: parseInt(data.sequence),
        blogName: data.blogName,
        sectionId: parseInt(data.sectionId),
        type: data.type,
        content: data.content,
        styleClass: data.styleClass
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        articleDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "blogName": row.blogName,
                    "sequence": row.sequence
                }
            }
        });
        articleItemKeys.push({
            PutRequest: {
                Item: {
                    "sequence": row.sequence,
                    "blogName": row.blogName,
                    "sectionId": row.sectionId,
                    "type": row.type,
                    "content": row.content,
                    "styleClass": row.styleClass
                }
            }
        });
        articleGetKeys.push({
            "blogName": row.blogName,
            "sequence": row.sequence
        });
    })
    .on('end', async rowCount => {
        await database.operation("deleteDocs", "article", articleDeleteKeys);
        await database.operation("insertDocs", "article", articleItemKeys);
        const docs = await database.operation("findDocs", "article", articleGetKeys);
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });