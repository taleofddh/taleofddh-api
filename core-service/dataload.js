const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const dotenv = require('dotenv');
const database = require('./db');

dotenv.config();

let menuDeleteKeys = [];
let menuItems = [];
let menuGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'menu.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        sequence: parseInt(data.sequence),
        name: data.name,
        type: data.type,
        link: data.link,
        external: data.external.toUpperCase() === 'TRUE',
        icon: data.icon,
        condition: data.condition,
        active: data.active.toUpperCase() === 'TRUE',
        position: data.position
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        menuDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "sequence": row.sequence
                }
            }
        });
        menuItems.push({
            PutRequest: {
                Item: {
                    "sequence": row.sequence,
                    "name": row.name,
                    "type": row.type,
                    "link": row.link,
                    "external": row.external,
                    "icon": row.icon,
                    "condition": row.condition,
                    "active": row.active,
                    "position": row.position
                }
            }
        });
        menuGetKeys.push({
            "sequence": row.sequence
        });
    })
    .on('end', async rowCount => {
        await dbOperation("deleteDocs", "menu", menuDeleteKeys, {});
        await dbOperation("insertDocs", "menu", menuItems);
        const docs = await dbOperation("findDocs", "menu", menuGetKeys);
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

let aboutUsDeleteKeys = [];
let aboutUsItems = [];
let aboutUsGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'aboutUs.csv'))
    .pipe(csv.parse({ headers: true, delimiter: '|' }))
    .transform(data => ({
        sequence: parseInt(data.sequence),
        header: data.header,
        description: data.description,
        image: data.image
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        aboutUsDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "sequence": row.sequence
                }
            }
        });
        aboutUsItems.push({
            PutRequest: {
                Item: {
                    "sequence": row.sequence,
                    "header": row.header,
                    "description": row.description,
                    "image": row.image
                }
            }
        });
        aboutUsGetKeys.push({
            "sequence": row.sequence
        });

    })
    .on('end', async rowCount => {
        await dbOperation("deleteDocs", "aboutUs", aboutUsDeleteKeys, {});
        await dbOperation("insertDocs", "aboutUs", aboutUsItems);
        const docs = await dbOperation("findDocs", "aboutUs", aboutUsGetKeys);
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

let promotionDeleteKeys = [];
let promotionItems = [];
let promotionGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'promotion.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        sequence: parseInt(data.sequence),
        title: data.title,
        tagLine: data.tagLine,
        image: data.image,
        link: data.link,
        active: data.active.toUpperCase() === 'TRUE'
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        promotionDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "sequence": row.sequence
                }
            }
        });
        promotionItems.push({
            PutRequest: {
                Item: {
                    "sequence": row.sequence,
                    "title": row.title,
                    "tagLine": row.tagLine,
                    "image": row.image,
                    "link": row.link,
                    "active": row.active
                }
            }
        });
        promotionGetKeys.push({
            "sequence": row.sequence
        });

    })
    .on('end', async rowCount => {
        await dbOperation("deleteDocs", "promotion", promotionDeleteKeys, {});
        await dbOperation("insertDocs", "promotion", promotionItems);
        const docs = await dbOperation("findDocs", "promotion", promotionGetKeys);
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

let countryDeleteKeys = [];
let countryItems = [];
let countryGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'country.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        code: data.code,
        name: data.name
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        countryDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "code": row.code,
                    "name": row.name
                }
            }
        });
        countryItems.push({
            PutRequest: {
                Item: {
                    "code": row.code,
                    "name": row.name                }
            }
        });
        countryGetKeys.push({
            "code": row.code,
            "name": row.name
        });
    })
    .on('end', async rowCount => {
        const batchSize = 25;
        let len = countryItems.length;
        for (let i = 0; i < len; i += batchSize) {
            let tempCountryDeleteKeys = countryDeleteKeys.slice(i, i + batchSize);
            await dbOperation("deleteDocs", "country", tempCountryDeleteKeys);
            let tempCountryItems = countryItems.slice(i, i + batchSize);
            await dbOperation("insertDocs", "country", tempCountryItems);
            let tempCountryGetKeys = countryGetKeys.slice(i, i + batchSize);
            const docs = await dbOperation("findDocs", "country", tempCountryGetKeys);
            await console.log(docs);
        }
        await console.log(`Parsed ${rowCount} rows`);
    });

let termsAndConditionsKey = [];
let termsAndConditionsItem = [];
fs.readFile('data/termsAndConditions.json', 'utf8', async (err, data) => {
    let termsAndConditionsList = await JSON.parse(data);
    let docPromises = {};
    docPromises = termsAndConditionsList.map(async (item) => {
        //console.log(item);
        termsAndConditionsKey = {
            Key: {
                "sequence": item.sequence
            }
        };
        await dbOperation("deleteDoc", "termsAndConditions", termsAndConditionsKey);
        termsAndConditionsItem = {
            Item: {
                "sequence": item.sequence,
                "header": item.header,
                "content": item.content
            }
        };
        await dbOperation("insertDoc", "termsAndConditions", termsAndConditionsItem);
        const doc = await dbOperation("findDoc", "termsAndConditions", termsAndConditionsKey);
        return doc;
    });
    var docs = await Promise.all(docPromises);
    console.log(docs);
});

let privacyPolicyKey = {};
let privacyPolicyItem = {};
fs.readFile('data/privacyPolicy.json', 'utf8', async (err, data) => {
    let privacyPolicyList = await JSON.parse(data);
    let docPromises = {};
    docPromises = privacyPolicyList.map(async (item) => {
        privacyPolicyKey = {
            Key: {
                "sequence": item.sequence
            }
        };
        await dbOperation("deleteDoc", "privacyPolicy", privacyPolicyKey);
        privacyPolicyItem = {
            Item: {
                "sequence": item.sequence,
                "header": item.header,
                "content": item.content
            }
        };
        await dbOperation("insertDoc", "privacyPolicy", privacyPolicyItem);
        const doc = await dbOperation("findDoc", "privacyPolicy", privacyPolicyKey);
        return doc;
    });
    const docs = await Promise.all(docPromises);
    console.log(docs);
});

let frequentlyAskedQuestionKey = {};
let frequentlyAskedQuestionItem = {};
fs.readFile('data/frequentlyAskedQuestion.json', 'utf8', async (err, data) => {
    let frequentlyAskedQuestionList = await JSON.parse(data);
    let docPromises = {};
    docPromises = frequentlyAskedQuestionList.map(async (item) => {
        frequentlyAskedQuestionKey = {
            Key: {
                "sequence": item.sequence
            }
        };
        await dbOperation("deleteDoc", "frequentlyAskedQuestion", frequentlyAskedQuestionKey);
        frequentlyAskedQuestionItem = {
            Item: {
                "sequence": item.sequence,
                "section": item.section,
                "questionAndAnswerList": item.questionAndAnswerList
            }
        }
        await dbOperation("insertDoc", "frequentlyAskedQuestion", frequentlyAskedQuestionItem);
        const doc = await dbOperation("findDoc", "frequentlyAskedQuestion", frequentlyAskedQuestionKey);
        return doc;
    });
    const docs = await Promise.all(docPromises);
    console.log(docs);
});

/*let auditItem = {};
fs.readFile('data/audit.json', 'utf8', async (err, data) => {
    let auditList = await JSON.parse(data);
    let docPromises = {};
    docPromises = auditList.map(async (item) => {
        auditItem = {
            Item: {
                "date": item.date,
                "hostName": item.hostName,
                "countryCode": item.countryCode,
                "ipAddress": item.ipAddress,
                "page": item.page,
                "message": item.message
            }
        }
        const doc = await dbOperation("insertDoc", "audit", auditItem);
        return doc;
    });
    const docs = await Promise.all(docPromises);
    console.log(docs);
});*/

const dbOperation = async (operation, table, data, filter) => {
    var tableName = process.env['ENVIRONMENT'] + '.' + process.env['APP_NAME'] + '.' + process.env['SERVICE_NAME'] + '.' + table;
    var response;
    var params;
    try {
        switch(operation) {
            case 'findDoc':
                data.TableName = tableName;
                params = data;
                response = await database.get(params);
                break;
            case 'findDocs':
                params = {
                    "RequestItems": {
                        [tableName]: {
                            "Keys": data
                        }
                    }
                }
                response = await database.batchGet(params, tableName);
                break;
            case 'insertDoc':
                data.TableName = tableName;
                params = data;
                response = await database.put(params);
                break;
            case 'insertDocs':
                params = {
                    "RequestItems": {
                        [tableName]: data
                    }
                }
                response = await database.batchWrite(params);
                break;
            case 'updateDoc':
                //response = await database.collection(collection).updateOne(query, data);
                break;
            case 'udpateDocs':
                //response = await database.collection(collection).updateMany(query, data);
                break;
            case 'deleteDoc':
                data.TableName = tableName;
                params = data;
                response = await database.delete(params);
                break;
            case 'deleteDocs':
                params = {
                    "RequestItems": {
                        [tableName]: data
                    }
                }
                response = await database.batchWrite(params);
                break;
            case 'queryDocs':
                filter.TableName = tableName
                params = filter;
                response = await database.query(params);
                break;
            case 'scanDocs':
                filter.TableName = tableName
                params = filter;
                response = await database.scan(params);
                break;
            case 'putDoc':
                data.TableName = tableName
                params = data;
                response = await database.putDocument(params);
                break;
            default:
                break;
        }
        return response;
    } catch (error) {
        console.error(error);
    }

}