'use strict';
const db = require('./db');

module.exports.menuList = async event => {
    const collection = "menu";
    let active  = (event.pathParameters.active === 'true');

    const database = await db.get();
    const docs = await db.findDocuments(database, collection, {"active" : active});
    return {
        statusCode: 200, body: JSON.stringify(docs)
    };
};
