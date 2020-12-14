'use strict';
const db = require('./db');
const collection = process.env['COLLECTION_NAME'];

module.exports.findBlogList = async (event) => {
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findCategorizedBlogList = async (event) => {
    const data = JSON.parse(event.body);
    let homePageFlag = data.homePageBlog === 'true';
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, homePageFlag ? {"category": data.category, "homePageFlag": homePageFlag} : {"category": data.category}, {"sequence": 1});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findBlogArticleList = async (event) => {
    const data = JSON.parse(event.body);
    const database = await db.get();
    const doc = await db.findDocument(database, "blog", {"name": data.blogName});
    doc.contents = await db.findDocuments(database, collection, {"blogName": data.blogName}, {"sectionId": 1});
    return {
        statusCode: 200,
        body: JSON.stringify(doc),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findArticleList = async (event) => {
    const data = JSON.parse(event.body);
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {"blogName": data.blogName}, {"sectionId": 1});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findArticleCommentList = async (event) => {
    const data = JSON.parse(event.body);
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {"blogName": data.blogName}, {"date": -1});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.addArticleComment = async (event) => {
    const data = JSON.parse(event.body);
    data.date = new Date();
    const database = await db.get();
    const docs = await db.insertDocument(database, collection, data);
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};
