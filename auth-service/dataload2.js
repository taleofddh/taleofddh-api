const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const dotenv = require('dotenv');
const MongoClient = require('mongodb').MongoClient;

dotenv.config();

let userProfiles = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'userProfile.csv'))
    .pipe(csv.parse({ headers: true, delimiter: '|' }))
    .transform(data => ({
        number: parseInt(data.number),
        identityId: data.identityId,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        email: data.email,
        address1: data.address1,
        address2: data.address2,
        city: data.city,
        postCode: data.postCode,
        countryCode: data.countryCode,
        phone: data.phone,
        about: data.about,
        communityList: data.communities,
        mailingFlag: data.mailingFlag.toUpperCase() === 'TRUE',
        updatedAt: new Date(data.updatedAt),
        lastLogin: new Date(data.lastLogin)
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        userProfiles.push(row)
    })
    .on('end', async rowCount => {
        userProfiles.sort((a,b) => (a.number > b.number) ? 1 : ((b.number > a.number) ? -1 : 0));
        await dbOperation("deleteDoc", "sequence", [], {"key": "user_seq"});
        const allCommunities = await dbOperation("findDocs", "community", [], {}, {"number": 1})
        for(i in userProfiles) {
            let communityList = []
            for(let j in allCommunities) {
                let match = false;
                let communities = userProfiles[i].communityList ? userProfiles[i].communityList.split(',') : [];
                for(let k in communities) {
                    //await console.log(communities[j]);
                    if(allCommunities[j].number === parseInt(communities[k])) {
                        match = true;
                    }
                }
                if(match) {
                    communityList.push({"community": allCommunities[j].name, "checked": true});
                } else {
                    communityList.push({"community": allCommunities[j].name, "checked": false});
                }
            }
            userProfiles[i].communityList = communityList;
        }
        await dbOperation("deleteDocs", "userProfile", [], {});
        await dbOperation("insertDocs", "userProfile", userProfiles);
        const docs = await dbOperation("findDocs", "userProfile", [], {}, {"number": 1}) ;
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