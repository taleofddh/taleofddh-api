'use strict';
const db = require('./db');
const collection = process.env['COLLECTION_NAME'];

module.exports.menuList = async (event) => {
    let active  = (event.pathParameters.active === 'true');
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {"active" : active});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};

module.exports.promotionList = async (event) => {
    let active  = (event.pathParameters.active === 'true');
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {"active" : active});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};

module.exports.aboutUsList = async (event) => {
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};

module.exports.termsAndConditionsList = async (event) => {
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};

module.exports.privacyPolicyList = async (event) => {
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};

module.exports.frequentlyAskedQuestionList = async (event) => {
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};

module.exports.countryByCode = async (event) => {
    let countryCode  = event.pathParameters.countryCode;
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {"code" : countryCode});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};

module.exports.countryByName = async (event) => {
    let countryName  = event.pathParameters.countryName;
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {"name" : countryName});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};