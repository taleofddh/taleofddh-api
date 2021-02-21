const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const dotenv = require('dotenv');
const database = require('./db');

dotenv.config();

let userProfileDeleteKeys = [];
let userProfileItems = [];
let userProfileGetKeys = [];
fs.createReadStream(path.resolve(__dirname, 'data', 'userProfile.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform(data => ({
        number: parseInt(data.number),
        identityId: data.identityId,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        email: data.email,
        address1: data.address1,
        address2: data.address2,
        city: data.city,
        postCode: data.postCode,
        countryCode: data.countryCode,
        phone: data.phone,
        about: data.about,
        communityList: JSON.parse(data.communityList),
        mailingFlag: data.mailingFlag.toUpperCase() === 'TRUE',
        updatedAt: data.updatedAt,
        lastLogin: data.lastLogin
    }))
    .on('error', error => console.error(error))
    .on('data', row => {
        userProfileDeleteKeys.push({
            DeleteRequest: {
                Key: {
                    "number": row.number
                }
            }
        });
        userProfileItems.push({
            PutRequest: {
                Item: {
                    "number": row.number,
                    "identityId": row.identityId,
                    "firstName": row.firstName,
                    "lastName": row.lastName,
                    "dateOfBirth": row.dateOfBirth,
                    "gender": row.gender,
                    "email": row.email,
                    "address1": row.address1,
                    "address2": row.address2,
                    "city": row.city,
                    "postCode": row.postCode,
                    "countryCode": row.countryCode,
                    "phone": row.phone,
                    "about": row.about,
                    "communityList": row.communityList,
                    "mailingFlag": row.mailingFlag,
                    "updatedAt": row.updatedAt,
                    "lastLogin": row.lastLogin
                }
            }
        });
        userProfileGetKeys.push({
            "number": row.number
        });
    })
    .on('end', async rowCount => {
        /*const commParams = {};
        const allCommunities = await dbOperation("scanDocs", "community", commParams);
        allCommunities.sort((a, b) => (a.number > b.number) ? 1 : ((b.number > a.number) ? -1 : 0));
        for(i in userProfileItems) {
            let communityList = [];
            for(let j in allCommunities) {
                let match = false;
                let communities = JSON.parse(userProfileItems[i].PutRequest.Item.communityList);
                communities.sort((a, b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));
                for(let k in communities) {
                    //await console.log(communities[j]);
                    if(allCommunities[j].number === parseInt(communities[k].id)) {
                        match = communities[k].checked;
                    }
                }
                //console.log(match);
                if(match) {
                    communityList.push({"id": allCommunities[j].number, "name": allCommunities[j].name, "checked": true});
                } else {
                    communityList.push({"id": allCommunities[j].number, "name": allCommunities[j].name, "checked": false});
                }
            }
            userProfileItems[i].PutRequest.Item.communityList = communityList;
        }*/
        await dbOperation("deleteDocs", "userProfile", userProfileDeleteKeys);
        await dbOperation("insertDocs", "userProfile", userProfileItems);
        const docs = await dbOperation("findDocs", "userProfile", userProfileGetKeys);
        await console.log(docs);
        const sequenceKey = {
            Item: {
                "key": "user_seq",
                "sequence": rowCount
            }
        }
        await dbOperation("updateDoc", "sequence", sequenceKey);
        await console.log(`Parsed ${rowCount} rows`);
    });

const dbOperation = async (operation, table, data) => {
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
                data.TableName = tableName;
                params = data;
                response = await database.put(params);
                break;
            case 'udpateDocs':
                params = {
                    "RequestItems": {
                        [tableName]: data
                    }
                }
                response = await database.batchWrite(params);
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
                data.TableName = tableName
                params = data;
                response = await database.query(params);
                break;
            case 'scanDocs':
                data.TableName = tableName
                params = data;
                response = await database.scan(params);
                break;
            default:
                break;
        }
        return response;
    } catch (error) {
        console.error(error);
    }
}