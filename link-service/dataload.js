const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const dotenv = require('dotenv');
const MongoClient = require('mongodb').MongoClient;

dotenv.config();

let links = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'link.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        sequence: parseInt(data.sequence),
        name: data.name,
        link: data.link,
        external: data.external.toUpperCase() === 'TRUE',
        icon: data.icon,
        active: data.active.toUpperCase() === 'TRUE',
        summary: data.summary,
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        links.push(row);
    })
    .on('end', async rowCount => {
        links.sort((a,b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
        await dbOperation("deleteDocs", "link", [], {});
        await dbOperation("insertDocs", "link", links);
        const docs = await dbOperation("findDocs", "link", [], {"active": true}, {"sequence": 1});
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

let visitStatues = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'visitStatus.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        sequence: parseInt(data.sequence),
        status: data.status,
        color: data.color,
        backgroundColor: data.backgroundColor
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        visitStatues.push(row);
    })
    .on('end', async rowCount => {
        visitStatues.sort((a,b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
        await dbOperation("deleteDocs", "visitStatus", [], {});
        await dbOperation("insertDocs", "visitStatus", visitStatues);
        const docs = await dbOperation("findDocs", "visitStatus", [], {}, {"sequence": 1});
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

let countryVisits = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'countryVisit.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        countryCode: data.countryCode,
        countryName: data.countryName,
        visitStatus: data.visitStatus
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        countryVisits.push(row);
    })
    .on('end', async rowCount => {
        countryVisits.sort((a, b) => a.countryCode.localeCompare(b.countryCode));
        await dbOperation("deleteDocs", "countryVisit", [], {});
        await dbOperation("insertDocs", "countryVisit", countryVisits);
        const docs = await dbOperation("findDocs", "countryVisit", [], {}, {});
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });


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