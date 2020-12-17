'use strict';
const db = require('./db');
const collection = process.env['COLLECTION_NAME'];

module.exports.findLinkList = async (event) => {
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
