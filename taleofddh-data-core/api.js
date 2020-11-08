const assert = require('assert');

module.exports = {
    findActiveMenuList : function(db, json, callback) {
        const name = 'menu';
        const collection = db.collection(name);
        collection.find( {'active': true}).toArray(function(err, docs) {
            assert.equal(err, null);
            console.log("Found the following active menus");
            console.log(docs);
            callback(null, docs);
        });
    },
    findActivePromotionList : function(db, json, callback)  {
        const name = 'promotion';
        const collection = db.collection(name);
        collection.find( {'active': true}).toArray(function(err, docs) {
            assert.equal(err, null);
            console.log("Found the following active promotions");
            console.log(docs);
            callback(null, docs);
        });
    },
    findAllAboutUsList : function(db, json, callback)  {
        const name = 'aboutUs';
        const collection = db.collection(name);
        collection.find( {}).toArray(function(err, docs) {
            assert.equal(err, null);
            console.log("Found the following aboutUs list");
            console.log(docs);
            callback(null, docs);
        });
    },
    findAllTermsAndConditionsList : function(db, json, callback)  {
        const name = 'termsAndConditions';
        const collection = db.collection(name);
        collection.find( {}).toArray(function(err, docs) {
            assert.equal(err, null);
            console.log("Found the following termsAndConditions list");
            console.log(docs);
            callback(null, docs);
        });
    },
    findAllPrivacyPolicyList : function(db, json, callback)  {
        const name = 'privacyPolicy';
        const collection = db.collection(name);
        collection.find( {}).toArray(function(err, docs) {
            assert.equal(err, null);
            console.log("Found the following privacyPolicy list");
            console.log(docs);
            callback(null, docs);
        });
    },
    findAllFrequentlyAskedQuestionList : function(db, json, callback)  {
        const name = 'frequentlyAskedQuestion';
        const collection = db.collection(name);
        collection.find( {}).toArray(function(err, docs) {
            assert.equal(err, null);
            console.log("Found the following frequentlyAskedQuestion list");
            console.log(docs);
            callback(null, docs);
        });
    },
    createDoc : function(db, json, callback) {
        db.collection('restaurants').insertOne( json, function(err, result) {
            if(err!=null) {
                console.error("an error occurred in createDoc", err);
                callback(null, JSON.stringify(err));
            }
            else {
                console.log("Kudos! You just created an entry into the restaurants collection with id: " + result.insertedId);
                callback(null, "SUCCESS");
            }
            //we don't need to close the connection thanks to context.callbackWaitsForEmptyEventLoop = false (above)
            //this will let our function re-use the connection on the next called (if it can re-use the same Lambda container)
            //db.close();
        });
    }
}
