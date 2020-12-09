'use strict';
'use strict';
const fetch = require('node-fetch');
const db = require('./db');
const collection = process.env['COLLECTION_NAME'];

module.exports.findIdentity = async (event) => {
    let userId = event.requestContext.identity.cognitoIdentityId;
    const identity = {
        identityId: userId
    }
    return {
        statusCode: 200,
        body: JSON.stringify(identity),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

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
    const userProfile = (!userId || userId === undefined) ? {} : await db.findDocument(database, collection,  data.email ? {"email": data.email, "identityId": data.identityId ? data.identityId : userId} : {"identityId": data.identityId ? data.identityId : userId});
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
    let userId = event.requestContext.identity.cognitoIdentityId;
    const database = await db.get();
    const existingProfile = await db.findDocument(database, collection, data.email ? {"email": data.email, "identityId": data.identityId} : {"identityId": data.identityId});
    let userProfile;
    if(!existingProfile) {
        userProfile = await createProfile(data, userId);
    } else {
        userProfile = await updateProfile(data, userId);
    }

    return {
        statusCode: 200,
        body: JSON.stringify(existingProfile),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

const createProfile = async (data, userId) => {
    const database = await db.get();
    var sequenceDoc = await db.findSequence(database, "sequence", {"key": "user_seq"});
    let communityList = []
    const allCommunities = await db.findDocuments(database, "community", {}, {"number": 1})
    for(let i in allCommunities) {
        communityList.push({"id": allCommunities[i].number, "name": allCommunities[i].name, "checked": false})
    }
    const profile = {
        number: sequenceDoc.sequence,
        identityId: data.identityId,
        firstName: data.firstName ? data.firstName : '',
        lastName: data.lastName ? data.lastName : '',
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : '',
        gender: data.gender ? data.gender : '',
        email: data.email ? data.email : '',
        address1: data.address1 ? data.address1 : '',
        address2: data.address2 ? data.address2 : '',
        city: data.city ? data.city : '',
        postCode: data.postCode ? data.postCode : '',
        countryCode: data.countryCode ? data.countryCode : '',
        phone: data.phone ? data.phone : '',
        about: data.about ? data.about : '',
        communityList: data.communityList ? data.communityList : communityList,
        mailingFlag: data.mailingFlag ? data.mailingFlag.toUpperCase() === 'TRUE' : true,
        updatedAt: new Date(),
        lastLogin: new Date()
    }
    return (!userId || userId === undefined) ? {} : await db.insertDocument(database, "userProfile",  profile);
}

module.exports.updateUserProfile = async (event) => {
    const data = JSON.parse(event.body);
    let userId = event.requestContext.identity.cognitoIdentityId;
    const userProfile = await updateProfile(data, userId);    
    return {
        statusCode: 200,
        body: JSON.stringify(userProfile),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};

const updateProfile = async (data, userId) => {
    const database = await db.get();
    let update = {}
    if(data.hasOwnProperty('firstName')) {
        update.firstName = data.firstName;
    }
    if(data.hasOwnProperty('lastName')) {
        update.lastName = data.lastName;
    }
    if(data.hasOwnProperty('dateOfBirth')) {
        update.dateOfBirth = new Date(data.dateOfBirth);
    }
    if(data.hasOwnProperty('gender')) {
        update.gender = data.gender;
    }
    if(data.hasOwnProperty('address1')) {
        update.address1 = data.address1;
    }
    if(data.hasOwnProperty('address2')) {
        update.address2 = data.address2;
    }
    if(data.hasOwnProperty('city')) {
        update.city = data.city;
    }
    if(data.hasOwnProperty('postCode')) {
        update.postCode = data.postCode;
    }
    if(data.hasOwnProperty('countryCode')) {
        update.countryCode = data.countryCode;
    }
    if(data.hasOwnProperty('phone')) {
        update.phone = data.phone;
    }
    if(data.hasOwnProperty('about')) {
        update.about = data.about;
    }
    if(data.hasOwnProperty('communityList')) {
        update.communityList = data.communityList;
    }
    if(data.hasOwnProperty('mailingFlag')) {
        update.mailingFlag = data.mailingFlag;
    }
    if(data.hasOwnProperty('updatedAt') && !data.lastLogin) {
        update.updatedAt = new Date(data.updatedAt);
    }
    if(data.hasOwnProperty('lastLogin')) {
        update.lastLogin = new Date(data.lastLogin);
    }
    const userProfile = (!userId || userId === undefined) ? {} : await db.updateDocument(database, collection,  data.email ? {"email": data.email, "identityId": data.identityId} : {"identityId": data.identityId}, { "$set": update });
    return {
        statusCode: 200,
        body: JSON.stringify(userProfile),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        }
    };
};