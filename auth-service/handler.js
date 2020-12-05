'use strict';
'use strict';
const fetch = require('node-fetch');
const db = require('./db');
const collection = process.env['COLLECTION_NAME'];

module.exports.findUser = async (event) => {
    const data = JSON.parse(event.body);
    const database = await db.get();
    const user = await db.findDocument(database, collection, { "username" : data.username, "password": data.password });
    return {
        statusCode: 200,
        body: JSON.stringify(user),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.createUser = async (event) => {
    const data = JSON.parse(event.body);
    const database = await db.get();
    var sequence = await db.findSequence(database, "sequence", {"key": "user_seq"});
    const profile = {
        number: sequence,
        identityId: data.userProfile.identityId,
        email: data.userProfile.email,
        mailingFlag: true,
        updatedAt: new Date(),
        lastLogin: new Date()
    }
    const userProfile = await createProfile(profile);

    const newUser = {
        number: sequence,
        username: data.username,
        password: data.password,
        userProfile: userProfile
    }

    const user = await db.insertDocument(database, collection, newUser);

    return {
        statusCode: 200,
        body: JSON.stringify(user),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.updateUser = async (event) => {
    const data = JSON.parse(event.body);
    const database = await db.get();
    let userId = event.requestContext.identity.cognitoIdentityId;
    const user = (!userId || userId === undefined) ? {} : await db.updateDocument(database, collection,  {"username": data.username}, data);
    return {
        statusCode: 200,
        body: JSON.stringify(user),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.findUserProfile = async (event) => {
    const data = JSON.parse(event.body);
    const database = await db.get();
    let userId = event.requestContext.identity.cognitoIdentityId;
    const userProfile = (!userId || userId === undefined) ? {} : await db.findDocuments(database, collection,  data.email ? {"email": data.email} : {"identityId": data.identityId});
    return {
        statusCode: 200,
        body: JSON.stringify(userProfile),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

module.exports.createUserProfile = async (event) => {
    const data = JSON.parse(event.body);
    const userProfile = await createProfile(data);
    return {
        statusCode: 200,
        body: JSON.stringify(userProfile),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

const createProfile = async (data) => {
    const database = await db.get();
    let userId = event.requestContext.identity.cognitoIdentityId;
    var sequence = await db.findSequence(database, "sequence", {"key": "user_seq"});
    var communities = data.communities ? data.communities.split(',') : [];
    let communityList = []
    for(let i in communities) {
        communityList.push(await db.findDocument(database, "community", {"number": parseInt(communities[i])}));
    }
    const profile = {
        number: data.number,
        identityId: data.identityId ? data.identityId : '',
        firstName: data.firstName ? data.firstName : '',
        lastName: data.lastName ? data.lastName : '',
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : '',
        gender: data.gender ? data.gender : '',
        email: data.email,
        address1: data.address1 ? data.address1 : '',
        address2: data.address2 ? data.address2 : '',
        city: data.city ? data.city : '',
        postCode: data.postCode ? data.postCode : '',
        countryCode: data.countryCode ? data.countryCode : '',
        phone: data.phone ? data.phone : '',
        about: data.about ? data.about : '',
        communityList: communityList,
        mailingFlag: data.mailingFlag ? data.mailingFlag.toUpperCase() === 'TRUE' : true,
        updatedAt: new Date(),
        lastLogin: new Date()
    }
    return (!userId || userId === undefined) ? {} : await db.insertDocument(database, "userProfile",  profile);
}

module.exports.updateUserProfile = async (event) => {
    const data = JSON.parse(event.body);
    const database = await db.get();
    let userId = event.requestContext.identity.cognitoIdentityId;
    const userProfile = (!userId || userId === undefined) ? {} : await db.updateDocument(database, collection,  data.email ? {"email": data.email} : {"identityId": data.identityId}, data);
    return {
        statusCode: 200,
        body: JSON.stringify(userProfile),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};