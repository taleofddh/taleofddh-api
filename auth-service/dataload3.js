const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const dotenv = require('dotenv');
const MongoClient = require('mongodb').MongoClient;

dotenv.config();

let users = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'user.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        number: parseInt(data.number),
        username: data.username,
        password: data.password,
        userProfile: data.userProfile
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        users.push(row);
    })
    .on('end', async rowCount => {
        users.sort((a,b) => (a.number > b.number) ? 1 : ((b.number > a.number) ? -1 : 0));
        let count = 0;
        for(let i in users) {
            users[i].userProfile = await dbOperation("findDoc", "userProfile", [], {"number": users[i].number});
            count++;
        }
        await dbOperation("deleteDocs", "user", [], {});
        await dbOperation("insertDocs", "user", users);
        const docs = await dbOperation("findDocs", "user", [], {}, {"number": 1}) ;
        console.log(docs);
        await dbOperation("insertDoc", "sequence", {"key": "user_seq", "sequence": count + 1});
        await console.log(`Parsed ${rowCount} rows`);
    });

let userRoles = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'userRole.csv'))
    .pipe(csv.parse({ headers: true, delimiter: '|' }))
    .transform(data => ({
        number: parseInt(data.number),
        userNumber: parseInt(data.userNumber),
        roleList: data.roleList
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        userRoles.push(row)
    })
    .on('end', async rowCount => {
        userRoles.sort((a,b) => (a.number > b.number) ? 1 : ((b.number > a.number) ? -1 : 0));
        await dbOperation("deleteDoc", "sequence", [], {"key": "userRole_seq"});
        await dbOperation("deleteDocs", "userRole", [], {});
        const allRoles = await dbOperation("findDocs", "role", [], {}, {"number": 1});
        let count = 0;
        for(i in userRoles) {
            let roleList = []
            for(let j in allRoles) {
                let match = false;
                let roles = userRoles[i].roleList ? userRoles[i].roleList.split(',') : [];
                for(let k in roles) {
                    if(allRoles[j].number === parseInt(roles[k])) {
                        match = true;
                    }
                }
                if(match) {
                    roleList.push({"id": allRoles[j].number, "name": allRoles[j].name});
                }
            }
            userRoles[i].roleList = roleList;
            count++;
        }
        await dbOperation("insertDocs", "userRole", userRoles);
        const docs = await dbOperation("findDocs", "userRole", [], {}, {"number": 1});
        await console.log(docs);
        await dbOperation("insertDoc", "sequence", {"key": "userRole_seq", "sequence": count + 1});
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