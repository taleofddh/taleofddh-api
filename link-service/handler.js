'use strict';
const db = require('./db');
const storage = require('./storage');
const collection = process.env['COLLECTION_NAME'];
const bucket = process.env['S3_BUCKET'];

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

module.exports.findTravelDocuments = async (event) => {
    const data = JSON.parse(event.body);
    const prefix = data.prefix;
    const folders = await storage.listBucket({Bucket: bucket, Delimiter: "/", Prefix: prefix + "/"});
    let docPromises ={};
    docPromises = folders.map(async (folder) => {
        return {...docPromises, folder: folder, files: await storage.listFolder({Bucket: bucket, Delimiter: "/", Prefix: prefix + "/" + folder + "/"})}
    })
    const docs = await Promise.all(docPromises);
    return {
        statusCode: 200,
        body: JSON.stringify(docs),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
}

module.exports.getTravelDocument = async (event) => {
    const data = JSON.parse(event.body);
    const prefix = data.prefix;
    const file = data.file;
    let object = await storage.getObject({Bucket: bucket, Key: prefix + "/" + file});
    return {
        isBase64Encoded: true,
        statusCode: 200,
        body: object.Body.toString('base64'),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
            "Content-Type": object.ContentType,
            "Content-Transfer-Encoding": "base64",
        }
    };
}
