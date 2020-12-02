const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const dotenv = require('dotenv');
const MongoClient = require('mongodb').MongoClient;

dotenv.config();

let menus = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'menu.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        number: parseInt(data.number),
        name: data.name,
        type: data.type,
        link: data.link,
        external: data.external.toUpperCase() === 'TRUE',
        icon: data.icon,
        condition: data.condition,
        active: data.active.toUpperCase() === 'TRUE',
        position: data.position,
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        menus.push(row);
    })
    .on('end', async rowCount => {
        menus.sort((a,b) => (a.number > b.number) ? 1 : ((b.number > a.number) ? -1 : 0));
        await dbOperation("deleteDocs", "menu", [], {});
        await dbOperation("insertDocs", "menu", menus);
        const docs = await dbOperation("findDocs", "menu", [], {"active": true}, {"sequence": 1});
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

let aboutUsList = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'aboutUs.csv'))
    .pipe(csv.parse({ headers: true, delimiter: '|' }))
    .transform(data => ({
        sequence: parseInt(data.sequence),
        header: data.header,
        description: data.description,
        image: data.image,
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        aboutUsList.push(row)
    })
    .on('end', async rowCount => {
        aboutUsList.sort((a, b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
        await dbOperation("deleteDocs", "aboutUs", [], {});
        await dbOperation("insertDocs", "aboutUs", aboutUsList);
        const docs = await dbOperation("findDocs", "aboutUs", [], {}, {"sequence": 1});
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

let promotions = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'promotion.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        sequence: parseInt(data.sequence),
        title: data.title,
        tagLine: data.tagLine,
        image: data.image,
        link: data.link,
        active: data.active.toUpperCase() === 'TRUE',
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        promotions.push(row)
    })
    .on('end', async rowCount => {
        promotions.sort((a, b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
        await dbOperation("deleteDocs", "promotion", [], {});
        await dbOperation("insertDocs", "promotion", promotions);
        const docs = await dbOperation("findDocs", "promotion", [], {"active": true}, {"_id": 1});
        await console.log(docs);
        await console.log(`Parsed ${rowCount} rows`);
    });

let countries = [];
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