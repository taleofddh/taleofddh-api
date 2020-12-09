const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const dotenv = require('dotenv');
const MongoClient = require('mongodb').MongoClient;

dotenv.config();

let albums = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'album.csv'))
    .pipe(csv.parse({ headers: true, delimiter: '|' }))
    .transform(data => ({
        sequence: parseInt(data.sequence),
        collectionName: parseInt(data.collectionName),
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        description: data.description,
        titlePhoto: parseInt(data.titlePhoto),
        viewCount: parseInt(data.viewCount),
        defaultFlag: data.defaultFlag.toUpperCase() === 'TRUE',
        restrictedFlag: data.restrictedFlag.toUpperCase() === 'TRUE'
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        albums.push(row)
    })
    .on('end', async rowCount => {
        albums.sort((a,b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0));
        for(let i in albums) {
            let title = albums[i].titlePhoto;
            const titleDoc = await dbOperation("findDoc", "photo", [], {"sequence": title});
            albums[i].titlePhoto = titleDoc;
        }
        await dbOperation("deleteDocs", "album", [], {});
        await dbOperation("insertDocs", "album", albums);
        const docs = await dbOperation("findDocs", "album", [], {}, {"sequence": 1});
        await console.log(docs);
        await dbOperation("updateDoc", "sequence", { $set: {"sequence": parseInt(`${rowCount}`)} }, {"key": "album_seq"}, )
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