
let MongoClient = require('mongodb').MongoClient;
let mongodb = require('mongodb');
//let url = 'mongodb://localhost:27017/Object_Storage_User_Mgmt';
let url = 'mongodb://localhost:27017';
let urlstorage = 'mongodb://localhost:27017/object_storage'

function connectdb() {
    return new Promise((resolve, reject) => {
        console.log("entered db connect");
        MongoClient.connect(url, (err, client) => {
            if (err) {
                reject(" Connection error");
            } else {
                console.log(" Connected to Mongo DB ");
                /*let db=client.db(dbname);
                console.log(" Connected to Object_Storage_User_Mgmt "+db);
                /*var cursor = db.collection('users').find();
                    cursor.each(function(err, doc) {
                        if(err){
                            console.log(err);
                        }else{
                            console.log(doc);
                        }
                    });*/
                resolve(client);
            }
        });
    });
}

/*function connectdbstorage(bktname) {
    return new Promise((resolve, reject) => {
        console.log("entered db connectdbstorage");
        mongodb.MongoClient.connect(urlstorage, function (err, db) {
            if (err) {
                reject(" Connection error");
            } else {
                console.log("connected to storage db " + bktname);
                let bucket = new mongodb.GridFSBucket(db, {
                    bucketName: bktname
                });
                resolve(bucket)
            }
        });
    });
}*/


module.exports = { connectdb };