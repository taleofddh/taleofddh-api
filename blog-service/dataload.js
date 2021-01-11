const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const dotenv = require('dotenv');
const database = require('./db');

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
        await dbOperation("deleteDocs", "blog", blogDeleteKeys);
        await dbOperation("insertDocs", "blog", blogItemKeys);
        const docs = await dbOperation("findDocs", "blog", blogGetKeys);
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
        await dbOperation("deleteDocs", "article", articleDeleteKeys);
        await dbOperation("insertDocs", "article", articleItemKeys);
        const docs = await dbOperation("findDocs", "article", articleGetKeys);
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

const dbOperation = async (operation, table, data, filter) => {
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
                data.TableName = tableName;
                params = data;
                response = await database.put(params);
                break;
            case 'udpateDocs':
                params = {
                    "RequestItems": {
                        [tableName]: data
                    }
                }
                response = await database.batchWrite(params);
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
                filter.TableName = tableName
                params = filter;
                response = await database.query(params);
                break;
            case 'scanDocs':
                filter.TableName = tableName
                params = filter;
                response = await database.scan(params);
                break;
            case 'putDoc':
                data.TableName = tableName
                params = data;
                response = await database.putDocument(params);
                break;
            default:
                break;
        }
        return response;
    } catch (error) {
        console.error(error);
    }
}