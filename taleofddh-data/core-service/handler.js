'use strict';
const db = require('./db');

module.exports.menuList = async event => {
    const collection = process.env['COLLECTION_NAME'];
    let active  = (event.pathParameters.active === 'true');

    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {"active" : active});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};

module.exports.promotionList = async event => {
    const collection = process.env['COLLECTION_NAME'];
    let active  = (event.pathParameters.active === 'true');

    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {"active" : active});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};

module.exports.aboutUsList = async event => {
    const collection = process.env['COLLECTION_NAME'];
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};

module.exports.termsAndConditionsList = async event => {
    const collection = process.env['COLLECTION_NAME'];
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};

module.exports.privacyPolicyList = async event => {
    const collection = process.env['COLLECTION_NAME'];
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};

module.exports.frequentlyAskedQuestionList = async event => {
    const collection = process.env['COLLECTION_NAME'];
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};

module.exports.countryByCode = async event => {
    const collection = process.env['COLLECTION_NAME'];
    let countryCode  = event.pathParameters.countryCode;

    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {"code" : countryCode});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};

module.exports.countryByName = async event => {
    const collection = process.env['COLLECTION_NAME'];
    let countryName  = event.pathParameters.countryName;

    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {"name" : countryName});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};