'use strict';
const db = require('./db');
const collection = process.env['COLLECTION_NAME'];

module.exports.findMenuList = async (event) => {
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

module.exports.findPromotionList = async (event) => {
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

module.exports.findAboutUsList = async (event) => {
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

module.exports.findTermsAndConditionsList = async (event) => {
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

module.exports.findPrivacyPolicyList = async (event) => {
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

module.exports.findFrequentlyAskedQuestionList = async (event) => {
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

module.exports.findCountryByCode = async (event) => {
    let countryCode  = event.pathParameters.countryCode;
    const database = await db.get();
    const docs = await db.findDocument(database, collection, {"code" : countryCode});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findCountryByName = async (event) => {
    let countryName  = event.pathParameters.countryName;
    const database = await db.get();
    const docs = await db.findDocument(database, collection, {"name" : countryName});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.createAuditEntry = async (event) => {
    const data = JSON.parse(event.body);
    const database = await db.get();
    const doc = await db.insertDocument(database, collection, data);
    return {
        statusCode: 200,
        body: JSON.stringify(doc),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};