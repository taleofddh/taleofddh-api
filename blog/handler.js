'use strict';
import * as database from '@taleofddh/database';
import * as storage from '@taleofddh/storage';
import * as response from '@taleofddh/response';
const table = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + process.env['TABLE_NAME'];
const bucket = process.env['S3_BUCKET'];

export const findBlogList = async (event) => {
    const params = {
        TableName: table
    };
    const blogList = await database.scan(params);
    blogList.sort((a, b) => a.category.localeCompare(b.category) || new Date(b.date) - new Date(a.date));
    return response.createResponse(blogList, 200);
};

export const findCategorizedBlogList = async (event) => {
    const data = JSON.parse(event.body);
    let homePageFlag = data.homePageBlog === 'true';
    const params = {
        TableName: table,
        FilterExpression: homePageFlag ? '#category = :category and #homePageFlag = :homePageFlag' : '#category = :category',
        ExpressionAttributeNames: homePageFlag ? {
            '#category': 'category',
            '#homePageFlag': 'homePageFlag'
        } : {
            '#category': 'category'
        },
        ExpressionAttributeValues: homePageFlag ? {':category': data.category, ':homePageFlag': homePageFlag} : {':category': data.category}
    };
    const blogList = await database.scan(params);
    blogList.sort((a,b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0) || a.date - b.date);
    return response.createResponse(blogList, 200);
};

export const updateBlogViewCount = async (event) => {
    const data = JSON.parse(event.body);
    const params = {
        TableName: table,
        Key: {
            "name": data.name,
            "category": data.category
        },
        UpdateExpression: "SET #viewCount = #viewCount + :inc",
        ExpressionAttributeNames: {
            "#viewCount": "viewCount"
        },
        ExpressionAttributeValues: { ":inc": 1 },
        ReturnValues: "ALL_NEW"
    }
    const updatedBlog = await database.update(params);
    return response.createResponse(updatedBlog, 200);
};

export const findBlogArticleList = async (event) => {
    const data = JSON.parse(event.body);
    let params = {
        TableName: process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + 'blog',
        Key: {
            'name': data.blogName,
            'category': data.category
        }
    };
    const blog = await database.get(params);
    params = {
        TableName: table,
        KeyConditionExpression: '#blogName = :blogName',
        ExpressionAttributeNames: {
            '#blogName': 'blogName',
        },
        ExpressionAttributeValues: {':blogName': data.blogName}
    };
    blog.contents = await database.query(params);
    blog.contents.sort((a,b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
    return response.createResponse(blog, 200);
};

export const findArticleList = async (event) => {
    const data = JSON.parse(event.body);
    const params = {
        TableName: table,
        KeyConditionExpression: '#blogName = :blogName',
        ExpressionAttributeNames: {
            '#blogName': 'blogName',
        },
        ExpressionAttributeValues: {':blogName': data.blogName}
    };
    const articleList = await database.query(params);
    articleList.sort((a,b) => (a.sectionId > b.sectionId) ? 1 : ((b.sectionId > a.sectionId) ? -1 : 0));
    return response.createResponse(articleList, 200);
};

export const findArticleCommentList = async (event) => {
    const data = JSON.parse(event.body);
    const params = {
        TableName: table,
        KeyConditionExpression: '#blogName = :blogName',
        ExpressionAttributeNames: {
            '#blogName': 'blogName',
        },
        ExpressionAttributeValues: {':blogName': data.blogName},
        ScanIndexForward: false
    };
    const articleCommentList = await database.query(params);
    return response.createResponse(articleCommentList, 200);
};

export const addArticleComment = async (event) => {
    const data = JSON.parse(event.body);
    const params = {
        TableName: table,
        Item: {
            "blogName": data.blogName,
            "name": data.name,
            "comment": data.comment,
            "date": data.date
        }
    }
    const articleComment = await database.put(params);
    return response.createResponse(articleComment, 200);
};

export const getArticleDocument = async (event) => {
    const data = JSON.parse(event.body);
    const prefix = data.prefix;
    const file = data.file;
    let object = await storage.getObject({Bucket: bucket, Key: prefix + "/" + file});
    return {
        statusCode: 200,
        body: JSON.stringify(await object.Body.transformToString('utf-8')),
        headers: {
            "isBase64Encoded": true,
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
            "Content-Type": object.ContentType
        }
    };
}