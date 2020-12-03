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
