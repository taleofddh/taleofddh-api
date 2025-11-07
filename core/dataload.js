import fs from 'fs';
import path from 'path';
import csv from 'fast-csv';
import dotenv from 'dotenv';
import * as storage from '@taleofddh/storage';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

let menuObject = [];
fs.readFile('data/menu.json', 'utf8', async (err, data) => {
    menuObject = await JSON.parse(data);
    await storageOperation("deleteObject", "menu");
    await storageOperation("putObject", "menu", menuObject);
    const object = await storageOperation("getObject", "menu");
    console.log(await object.Body.transformToString());
});

let aboutUsObject = [];
fs.readFile('data/aboutUs.json', 'utf8', async (err, data) => {
    aboutUsObject = await JSON.parse(data);
    await storageOperation("deleteObject", "aboutUs");
    await storageOperation("putObject", "aboutUs", aboutUsObject);
    const object = await storageOperation("getObject", "aboutUs");
    console.log(await object.Body.transformToString());
});

let promotionObject = [];
fs.readFile('data/promotion.json', 'utf8', async (err, data) => {
    promotionObject = await JSON.parse(data);
    await storageOperation("deleteObject", "promotion");
    await storageOperation("putObject", "promotion", promotionObject);
    const object = await storageOperation("getObject", "promotion");
    console.log(await object.Body.transformToString());
});

let countryObject = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'country.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        code: data.code,
        name: data.name
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        countryObject.push({
            "code": row.code,
            "name": row.name
        });
    })
    .on('end', async rowCount => {
        await storageOperation("deleteObject", "country");
        await storageOperation("putObject", "country", countryObject);
        const object = await storageOperation("getObject", "country");
        console.log(await object.Body.transformToString());
        console.log(`Parsed ${rowCount} rows`);
    });

let termsAndConditionsObject = [];
fs.readFile('data/termsAndConditions.json', 'utf8', async (err, data) => {
    termsAndConditionsObject = await JSON.parse(data);
    await storageOperation("deleteObject", "termsAndConditions");
    await storageOperation("putObject", "termsAndConditions", termsAndConditionsObject);
    const object = await storageOperation("getObject", "termsAndConditions");
    console.log(await object.Body.transformToString());
});

let privacyPolicyObject = [];
fs.readFile('data/privacyPolicy.json', 'utf8', async (err, data) => {
    privacyPolicyObject = await JSON.parse(data);
    await storageOperation("deleteObject", "privacyPolicy");
    await storageOperation("putObject", "privacyPolicy", privacyPolicyObject);
    const object = await storageOperation("getObject", "privacyPolicy");
    console.log(await object.Body.transformToString());
});

let frequentlyAskedQuestionObject = {};
fs.readFile('data/frequentlyAskedQuestion.json', 'utf8', async (err, data) => {
    frequentlyAskedQuestionObject = await JSON.parse(data);
    await storageOperation("deleteObject", "frequentlyAskedQuestion");
    await storageOperation("putObject", "frequentlyAskedQuestion", frequentlyAskedQuestionObject);
    const object = await storageOperation("getObject", "frequentlyAskedQuestion");
    console.log(await object.Body.transformToString());
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

const storageOperation = async (operation, object, data) => {
    const bucketName = process.env['S3_BUCKET'];
    const key = `${process.env['ENVIRONMENT']}/${process.env['SERVICE_NAME']}/${object}.json`;
    let response;
    let params;
    try {
        switch(operation) {
            case 'getObject':
                params = {
                    Bucket: bucketName,
                    Key: key
                }
                response = await storage.getObject(params);
                break;
            case 'putObject':
                params = {
                    Bucket: bucketName,
                    Key: key,
                    Body: JSON.stringify(data),
                    ContentType: 'application/json',
                }
                response = await storage.putObject(params);
                break;
            case 'deleteObject':
                params = {
                    Bucket: bucketName,
                    Key: key
                }
                response = await storage.deleteObject(params);
                break;
            case 'selectObjectContent':
                params = {
                    Bucket: bucketName,
                    Key: key,
                    ExpressionType: 'SQL',
                    Expression: data,
                    InputSerialization: {
                        CompressionType: 'NONE',
                        JSON: {
                            Type: 'DOCUMENT'
                        }
                    },
                    OutputSerialization: {
                        JSON: {}
                    }
                }
                response = await storage.selectObjectContent(params);
                break;
            default:
                break;
        }
        return response;
    } catch (error) {
        console.error(error);
    }
}
