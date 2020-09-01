/*const mongoose=require('mongoose');
//const conn= mongoose.createConnection('mongodb://localhost:27017/object_storage');
let db=mongoose.connect('mongodb://localhost:27017/Object_Storage_User_Mgmt',{ useUnifiedTopology: true, useNewUrlParser: true},(err)=>{
if(!err)
{
    console.log('MongoDB connection to object Storage successful');
}
else{
    console.log('MongoDB connection error : '+err);
}
});

require('./models/schema');*/


let MongoClient = require('mongodb').MongoClient;
//let url = 'mongodb://localhost:27017/Object_Storage_User_Mgmt';
let url = 'mongodb://localhost:27017';

function connectdb(){
    return new Promise((resolve,reject)=>{
        console.log("entered db connect");
        MongoClient.connect(url, (err, client) => { 
            if(err){
                reject(" Connection error");
            }else{
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

module.exports={connectdb};