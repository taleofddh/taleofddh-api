'use strict';
const db = require('./db');
const collection = process.env['COLLECTION_NAME'];

module.exports.albumList = async (event) => {
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};

module.exports.albumListByRestrictedFlag = async (event) => {
    let restrictedFlag  = (event.pathParameters.restrictedFlag === 'true');
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {"restrictedFlag": restrictedFlag});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};

module.exports.photoListByAlbumName = async (event) => {
    let albumName = event.pathParameters.albumName;
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {"albumName": albumName});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};

module.exports.photoListByAlbumNameAndRestrictedFlag = async (event) => {
    let albumName = event.pathParameters.albumName;
    let restrictedFlag  = (event.pathParameters.restrictedFlag === 'true');
    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {"albumName": albumName, "restrictedFlag": restrictedFlag});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};