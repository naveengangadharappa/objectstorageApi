const mongoose = require('mongoose');
const conn = require('./db_connect');
const MongoClient = require('mongodb').MongoClient;
/*const Users=mongoose.model('users');
const Projects=mongoose.model('projects');
const Files=mongoose.model('files');
const Approval=mongoose.model('approval');
const Pmapping=mongoose.model('pmapping');*/
let dbname = 'Object_Storage_User_Mgmt'
const projects = [
    {
        prjid: "ipas",
        dbbucket: 'Ipas',
        backup: true,
        token: "ipastoken"
    }];

let generate_id = async function () {
    return new Promise((resolve, reject) => {
        //console.log(new Date().getTime());
        //console.log(new Date());
        console.log(Math.random() * Math.floor(1234598745));
        resolve(Math.round(Math.random() * Math.floor(1234598745) + new Date().getTime()));
    });
}

let insertuser = async function (req) {
    try {
        let dbclient = await conn.connectdb();
        let db = dbclient.db(dbname);
        let insert_obj = {
            u_id: req.body.uid,
            u_fname: req.body.ufname,
            u_lname: req.body.ulname,
            u_email: req.body.uemail,
            u_designation: req.body.udesig,
            u_password: req.body.upswd,
            u_status: req.body.ustatus
        };
        return new Promise((resolve, reject) => {
            db.collection('users').insertOne(insert_obj, (err) => {
                if (err) {
                    console.log("error");
                    resolve(false);
                } else {
                    console.log("error successfull");
                    resolve(true);
                }
            });
        });
    } catch (err) {
        console.log("error " + err);
    }
}

/*let cursor = db.collection('users').find();
                    cursor.each(function(err, doc) {
                        if(err){
                            reject("Error in Users fecthing");
                        }else{
                            console.log(doc);
                            resolve(doc);
                        } 
                    });*/



let insertprojects = async function (req) {
    try {
        let dbclient = await conn.connectdb();
        let db = dbclient.db(dbname);
        let Pid = await generate_id();
        let ptoken = await generate_id();
        let insert_obj = {
            p_id: Pid.toString(),
            p_name: req.body.pname,
            p_Manager_id: req.body.pmgrid,
            p_token: ptoken.toString(),
            p_backup: false
        };
        return new Promise((resolve, reject) => {
            db.collection('users').findOne({ u_id: req.body.pmgrid }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    if (res == null) {
                        resolve({ msg: "Manager Doesn't Exists ", status: false });
                    } else {
                        db.collection('projects').insertOne(insert_obj, (err) => {
                            if (err) {
                                reject(err)
                            } else {
                                projects.push({
                                    prjid: Pid,
                                    backup: true,
                                    collectionname: "file-objects",
                                    token: ptoken,
                                    dbbucket: req.body.pname,
                                });
                                resolve({ msg: "Project created successfull", Project_id: Pid, P_token: ptoken, status: true });
                            }
                        });
                    }
                }
                // db.close();
            });
        });
    } catch (err) {
        console.log("error " + err);
    }
}



let insertfiles = async function (fid, fname, pid, fsize) {
    try {
        let dbclient = await conn.connectdb();
        let db = dbclient.db(dbname);
        let insert_obj = {
            f_id: fid,
            f_name: fname,
            p_id: pid,
            f_size: fsize
        };
        return new Promise((resolve, reject) => {
            db.collection('files').insertOne(insert_obj, (err) => {
                if (err) {
                    console.log("error" + err);
                    reject(err);
                } else {
                    console.log("successfull");
                    resolve(true);
                }
            });
        });
    } catch (err) {
        console.log("error " + err);
    }
}

let insertprojectapproval = async function (req, uid) {
    try {
        let dbclient = await conn.connectdb();
        let db = dbclient.db(dbname);
        let insert_obj = {
            u_id: uid,
            p_status: "P",
            p_id: req.body.pid,
        };
        return new Promise((resolve, reject) => {
            db.collection('approval').insertOne(insert_obj, (err) => {
                if (err) {
                    console.log("error" + err);
                    reject(err);
                } else {
                    console.log("successfull");
                    resolve({ message: "Request for Project Approval Successfull", status: true });
                }
            });
        });
    } catch (err) {
        console.log("error " + err);
    }
}

let updateprojectmapping = async function (req) {
    try {
        let dbclient = await conn.connectdb();
        let db = dbclient.db(dbname);
        let query_obj = {
            u_id: req.body.uid,
            p_id: req.body.pid
        };
        pstatus = (req.body.status == "true" || req.body.status) ? true : false;
        return new Promise((resolve, reject) => {
            db.collection('pmapping').updateOne(query_obj, { $set: { p_status: pstatus } }, (err) => {
                if (err) {
                    console.log("error" + err);
                    reject(err);
                } else {
                    console.log("successfull");
                    resolve({ message: (pstatus) ? "Project Access Approved Successfully" : "Project Access Reverted Successfully", status: true });
                }
            });
        });
    } catch (err) {
        console.log("error " + err);
    }
}


async function insertmapping(req, uid) {
    try {
        let dbclient = await conn.connectdb();
        let db = dbclient.db(dbname);
        let insert_obj = {
            u_id: uid,
            p_id: req.body.pid,
            p_status: false,
        };
        return new Promise((resolve, reject) => {
            db.collection('pmapping').insertOne(insert_obj, (err) => {
                if (err) {
                    console.log("error" + err);
                    reject(err);
                } else {
                    console.log("successfull");
                    resolve({ message: "Project Requested Successfully", status: true });
                }
            });
        });
    } catch (err) {
        console.log("error " + err);
    }
}
async function getAllusers() {
    try {
        let result = [];
        let dbclient = await conn.connectdb();
        let db = dbclient.db(dbname);
        return new Promise((resolve, reject) => {
            let cursor = db.collection('users').find();
            cursor.each(function (err, doc) {
                if (err) {
                    reject("Error in Users fecthing");
                } else {
                    console.log(doc);
                    result.push({ uid: doc.u_id, uname: doc.u_fname, umail: doc.u_email })
                }
            });
            resolve({ data: result, msg: "List of Users found", status: false });
        });
    } catch (err) {
        console.log("error " + err);
    }
}

async function getAllMgrs() {
    try {
        let dbclient = await conn.connectdb();
        let db = dbclient.db(dbname);
        let result = [];
        return new Promise((resolve, reject) => {
            db.collection('users').find({ manager: true, mgr_req: "A" }).toArray((err, res) => {
                if (err) {
                    reject(err);
                } else {
                    if (res == null) {
                        resolve({ data: result, msg: "No Managers  found ", status: false });
                    } else {
                        console.log(res);
                        res.map((doc) => {
                            console.log(doc);
                            result.push({ uid: doc.u_id, uname: doc.u_fname, umail: doc.u_email });
                        })
                        resolve({ data: result, msg: "List of All Managers ", status: true });
                    }
                }
            });
        });
    } catch (err) {
        console.log("error " + err);
    }
}

async function getAllprojects(req) {
    try {
        let result = [];
        let dbclient = await conn.connectdb();
        let db = dbclient.db(dbname);
        return new Promise((resolve, reject) => {
            let cursor = db.collection('projects').find();
            cursor.each(function (err, doc) {
                if (err) {
                    reject("Error in Projects fecthing");
                } else {
                    console.log(doc);
                    result.push(doc);
                }
            });
            resolve({ data: result, msg: "List of all Projects", status: true });
        });
    } catch (err) {
        console.log("error " + err);
    }
}

async function userlogin(req) {
    try {
        let dbclient = await conn.connectdb();
        let db = dbclient.db(dbname);
        return new Promise((resolve, reject) => {
            if (req.body.uid == "" || req.body.password == "") {
                resolve({ msg: "Please Enter Email and Password", status: false });
            } else {
                db.collection('users').findOne({ u_id: req.body.uid, u_password: req.body.password }, (err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (res == null) {
                            resolve({ msg: "User Doesn't Exists/Password Mismatch ", status: false });
                        } else if (res.u_status) {
                            resolve({ msg: "Login Successfull ", status: true });
                        } else {
                            resolve({ msg: "This User is blocked Please contact your manager ", status: false });
                        }
                    }
                });
            }
        });
    } catch (err) {
        console.log("error " + err);
    }
}



async function search(req, option) {
    try {
        let dbclient = await conn.connectdb();
        let db = dbclient.db(dbname);
        let collectionname = option;
        return new Promise((resolve, reject) => {
            if (req.body.email == "" || req.body.password == "") {
                resolve({ msg: "Please Enter Email and Password", status: false });
            } else {
                //db.streets.find( { street_name : /^Al/i } );
                //db.streets.find( { street_name : { $regex : '^Al', $options: 'i' } } );
                db.collection(collectionname).findOne({ u_fname: "^" + req.body.uname + "i" }, (err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (res == null) {
                            resolve({ msg: "User Doesn't Exists/Password Mismatch ", status: false });
                        } else if (res.u_status) {
                            resolve({ msg: "Login Successfull ", status: true });
                        } else {
                            resolve({ msg: "This User is blocked Please contact your manager ", status: false });
                        }
                    }
                });
            }
        });
    } catch (err) {
        console.log("error " + err);
    }
}

async function getuserprj(uid) {
    try {
        let dbclient = await conn.connectdb();
        let db = dbclient.db(dbname);
        let result = [];
        return new Promise((resolve, reject) => {
            db.collection('pmapping').aggregate([
                {
                    $match: { u_id: uid, p_status: true }
                }, {
                    $lookup:
                    {
                        from: 'projects',
                        localField: 'p_id',
                        foreignField: 'p_id',
                        as: 'userprjs'
                    }
                }
            ]).toArray(function (err, res) {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {

                    console.log("res =" + JSON.stringify(res));
                    res.map((doc) => {
                        console.log(doc);
                        result.push(doc.userprjs);
                    })
                    if (result.length > 0) {
                        resolve({ data: result, msg: "Projects available for user", status: true });
                    } else {
                        resolve({ msg: "Sorry No Projects available for user", status: true });
                    }
                }
            });
        });
    } catch (err) {
        console.log("error " + err);
    }
}

async function getproject(req) {
    /*new Promise((resolve,reject)=>{
        var pmap=new Pmapping();
        pmap.u_id=req.body.uid;
        pmap.p_id=req.body.pid;
        pmap.p_Manager_id=req.body.pmgrid;
        pmap.save((err,doc)=>{
            if(!err){
                resolve(true)
            }else{
                reject(false);
            }
        });
    });*/
}

//to check whether collection exists befor backup
async function backupcollection(req) {
    let dbclient = await conn.connectdb();
    let db = dbclient.db(dbname);
    result = db.runCommand({ listCollections: 1 });
    console.log(result);
}





module.exports = { projects, insertfiles, insertuser, insertmapping, insertprojects, insertprojectapproval, userlogin, updateprojectmapping, getAllMgrs, getAllprojects, getAllusers, getuserprj, search, backupcollection };