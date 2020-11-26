'use strict';
const db = require('./db');
const collection = process.env['COLLECTION_NAME'];

module.exports.findAlbumList = async (event) => {
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

module.exports.findRestrictedAlbumList = async (event) => {
    const data = JSON.parse(event.body);
    let restrictedFlag  = (data.restrictedFlag === 'true');
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

module.exports.findPhotoList = async (event) => {
    const data = JSON.parse(event.body);
    let userId = event.requestContext.identity.cognitoIdentityId;
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, (!userId || userId === undefined) ? {"albumName": data.albumName, "restrictedFlag": false} : {"albumName": data.albumName});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findRestrictedPhotoList = async (event) => {
    const data = JSON.parse(event.body);
    let restrictedFlag  = (data.restrictedFlag === 'true');
    let userId = event.requestContext.identity.cognitoIdentityId;
    const database = await db.get();
    const docs = (restrictedFlag && (!userId || userId === undefined)) ? [] : await db.findDocuments(database, collection, restrictedFlag ? {"albumName": data.albumName} : {"albumName": data.albumName, "restrictedFlag": restrictedFlag});
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};