const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const dotenv = require('dotenv');
const MongoClient = require('mongodb').MongoClient;

dotenv.config();

let blogs = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'blog.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        sequence: parseInt(data.sequence),
        name: data.name,
        author: data.author,
        category: data.category,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        homePageFlag: data.homePageFlag.toUpperCase() === 'TRUE',
        header: data.header,
        summary: data.summary,
        titlePhoto: data.titlePhoto,
        viewCount: parseInt(data.viewCount),
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        blogs.push(row);
    })
    .on('end', async rowCount => {
        blogs.sort((a,b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
        await dbOperation("deleteDocs", "blog", [], {});
        await dbOperation("insertDocs", "blog", blogs);
        const docs = await dbOperation("findDocs", "blog", [], {"homePageFlag": true}, {"sequence": 1});
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

/*
let articles = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'country.csv'))
    .pipe(csv.parse({ headers: true }))
    .on('error', error => console.error(error))
    .on('data', row => {
        countries.push(row)
    })
    .on('end', async rowCount => {
        countries.sort((a, b) => a.code.localeCompare(b.code));
        await dbOperation("deleteDocs", "country", [], {});
        await dbOperation("insertDocs", "country", countries);
        const docs = await dbOperation("findDocs", "country", [], {}, {"_id": 1});
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });
*/

const dbOperation = async (operation, collection, data, query, sort) => {
    // for async it only works with Promise and resolve/reject
    return new Promise(async (resolve, reject) => {
        // Connect using the connection string
        await MongoClient.connect(process.env['MONGODB_ATLAS_CLUSTER_URI'], { useNewUrlParser: true, useUnifiedTopology: true }, async (err, client) => {
            if (err) {
                reject(err);
            } else {
                //the following line is critical for performance reasons to allow re-use of database connections across calls to this Lambda function and avoid closing the database connection. The first call to this lambda function takes about 5 seconds to complete, while subsequent, close calls will only take a few hundred milliseconds.
                var database = await client.db(process.env['DB_NAME']);
                var response;
                switch(operation) {
                    case 'findDoc':
                        response = await database.collection(collection).findOne(query);
                        break;
                    case 'findDocs':
                        response = await database.collection(collection).find(query).sort(sort).toArray();
                        break;
                    case 'insertDoc':
                        response = await database.collection(collection).insertOne(data);
                        break;
                    case 'insertDocs':
                        response = await database.collection(collection).insertMany(data);
                        break;
                    case 'updateDoc':
                        response = await database.collection(collection).updateOne(query, data);
                        break;
                    case 'udpateDocs':
                        response = await database.collection(collection).updateMany(query, data);
                        break;
                    case 'deleteDoc':
                        response = await database.collection(collection).deleteOne(query);
                        break;
                    case 'deleteDocs':
                        response = await database.collection(collection).deleteMany(query);
                        break;
                    default:
                        break;
                }
                await client.close();
                //await console.log(response);
                resolve(response);
            }
        });
    });
}