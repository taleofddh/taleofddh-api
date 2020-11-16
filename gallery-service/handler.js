'use strict';
const db = require('./db');
const collection = process.env['COLLECTION_NAME'];

module.exports.albumList = async (event) => {
    const database = await db.get();
    let userId = event.requestContext.identity.cognitoIdentityId;
    const docs = await db.findDocuments(database, collection, (!userId || userId === undefined) ? {"restrictedFlag": false} : {});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.albumListByRestrictedFlag = async (event) => {
    let restrictedFlag  = (event.pathParameters.restrictedFlag === 'true');
    let userId = event.requestContext.identity.cognitoIdentityId;
    const database = await db.get();
    const docs = (restrictedFlag && (!userId || userId === undefined)) ? [] : await db.findDocuments(database, collection, {"restrictedFlag": restrictedFlag});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.photoListByAlbumName = async (event) => {
    let albumName = event.pathParameters.albumName;
    let userId = event.requestContext.identity.cognitoIdentityId;
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, (!userId || userId === undefined) ? {"albumName": albumName, "restrictedFlag": false} : {"albumName": albumName});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.photoListByAlbumNameAndRestrictedFlag = async (event) => {
    let albumName = event.pathParameters.albumName;
    let restrictedFlag  = (event.pathParameters.restrictedFlag === 'true');
    let userId = event.requestContext.identity.cognitoIdentityId;
    const database = await db.get();
    const docs = (restrictedFlag && (!userId || userId === undefined)) ? [] : await db.findDocuments(database, collection, restrictedFlag ? {"albumName": albumName} : {"albumName": albumName, "restrictedFlag": restrictedFlag});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};