'use strict';
const db = require('./db');
const collection = process.env['COLLECTION_NAME'];

module.exports.menuList = async (event) => {
    let active  = (event.pathParameters.active === 'true');
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {"active" : active}, {"sequence": 1});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.promotionList = async (event) => {
    let active  = (event.pathParameters.active === 'true');
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {"active" : active}, {"sequence": 1});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.aboutUsList = async (event) => {
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {}, {"sequence": 1});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.termsAndConditionsList = async (event) => {
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {}, {"_id": 1});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.privacyPolicyList = async (event) => {
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {}, {"_id": 1});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.frequentlyAskedQuestionList = async (event) => {
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {}, {"_id": 1, "questionAndAnswerList.sequence": 1});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.countryByCode = async (event) => {
    let countryCode  = event.pathParameters.countryCode;
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {"code" : countryCode});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.countryByName = async (event) => {
    let countryName  = event.pathParameters.countryName;
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {"name" : countryName});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};