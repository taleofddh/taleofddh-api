'use strict';
'use strict';
const fetch = require('node-fetch');
const db = require('./db');
const collection = process.env['COLLECTION_NAME'];

module.exports.findUser = async (event) => {
    const data = JSON.parse(event.body);
    const database = await db.get();
    const user = await db.findDocument(database, collection, { "username" : data.username, "password": data.password });
    return {
        statusCode: 200,
        body: JSON.stringify(user),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findUserProfile = async (event) => {
    const database = await db.get();
    let userId = event.requestContext.identity.cognitoIdentityId;
    const userProfile = (!userId || userId === undefined) ? {} : await db.findDocuments(database, collection,  {"email": userId});
    return {
        statusCode: 200,
        body: JSON.stringify(userProfile),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};