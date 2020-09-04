const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
var backup = require('./db/backup/mongodb_backup');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const router = express.Router();
let mongoconnection = require('./db/db_connect');
var dbfunctions = require('./db/dboperations');
let mongouri = 'mongodb://localhost:27017/object_storage';
let gfs;
let mongodb = require('mongodb')


//let conn = mongoose.createConnection(mongouri);
let bktname = 'Ipas';
//let bucket = mongoconnection.connectdbstorage(bktname);
//console.log("dbcon = ");
//console.log(bucket);
/*conn.once('open', () => {
    //initaling stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection(bktname);
    console.log('bucket initalised');
})*/
let db;
mongodb.MongoClient.connect(mongouri, (err, database) => {
    if (err) {
        console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
        process.exit(1);
    }
    db = database;
});

let bucket = new mongodb.GridFSBucket(db, {
    bucketName: bktname
});
console.log(bucket);



let storage = (req, file) => {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
            if (err) {
                return reject(err);
            }
            const filename = buf.toString('hex') + path.extname(file.originalname);
            const fileinfo = {
                filename: filename,
                bucketName: bktname
            };
            bucket.openUploadStream(filename).
                on('error', function (error) {
                    assert.ifError(error);
                }).
                on('finish', function () {
                    console.log("file upload finish");
                    dbfunctions.insertfiles(filename, file.originalname, req.headers["project"], "").then((result) => {
                        if (result) {
                            resolve(fileinfo);
                        }
                    }).catch((err) => {
                        console.log(err);
                        reject("DB error");
                    });
                    process.exit(0);
                });
        });
    });
};

const upload = multer({ storage });
const upload1 = multer({
    storage: storage,
    fileFilter: function (req, files, callback) {
        console.log("enterd call back");
        let prj = req.headers["project"];
        let token = req.headers["token"];
        for (let i = 0; i < dbfunctions.projects.length; i++) {
            if (dbfunctions.projects[i].prjid == prj) {
                if (dbfunctions.projects[i].token == token) {
                    console.log("dbbkt " + dbfunctions.projects[i].dbbucket);
                    bktname = dbfunctions.projects[i].dbbucket;
                    conn.once('open', () => {
                        //initaling stream
                        gfs = Grid(conn.db, mongoose.mongo);
                        gfs.collection(bktname);
                    })

                    callback(null, true);
                    break;
                } else {
                    callback(null, false);
                    break;
                }
            } else {
                break;
            }
        }
        callback(null, false);
    },
    // limits: {1024*1024}  
});

const arrUpload = upload.array('file', 4);

router.get('/', (req, res) => {
    try {
        let prj = req.headers["project"];
        let token = req.headers["token"];
        for (let i = 0; i < projects.length; i++) {
            if (dbfunctions.projects[i].prjid == prj) {
                if (dbfunctions.projects[i].token == token) {
                    res.json({ message: "Connected to object storage of " + prj, status: true });

                    break;
                } else {
                    res.json({ message: "Token Mismatch ", status: false });
                    break;
                }
            } else {
                res.json({ message: "Project Not Found", status: true });
            }
        }
    } catch (err) {
        console.log(err);
        res.json({ message: "Please include Api Token" });
    }
});


/*app.post('/rest/upload',
upload.fields([{
    name: 'video', maxCount: 1
  }, {
    name: 'subtitles', maxCount: 1
  }]), function(req, res, next){
// ...
}*/

//router.post('/upload_file',upload.single('file'),(req,res)=>{
router.post('/upload_file', upload1.single('file'), (req, res) => {
    try {
        console.log("entering to response");
        /*if (req.file === undefined){
            //console.log(req.file);
            response={message:"No file selected to upload",status:false}; 
            res.json(response);       
        }else{*/
        let prj = req.headers["project"];
        let token = req.headers["token"];
        let response = {};
        for (let i = 0; i < dbfunctions.projects.length; i++) {
            if (dbfunctions.projects[i].prjid == prj) {
                if (dbfunctions.projects[i].token == token) {
                    response = { filedetails: req.file, message: "File Upload Successfull", status: true };
                    break;
                } else {
                    response = { filedetails: [], message: "Token missmatch", status: false };
                    break;
                }
            } else {
                response = { filedetails: [], message: "Project not found", status: false };
            }
        }
        res.json(response);
        // }      
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: "Please include Api Token" });
    }
});

router.post('/upload_files', arrUpload, (req, res, next) => {
    try {
        let prj = req.headers["project"];
        let token = req.headers["token"];
        let response = {};
        for (let i = 0; i < dbfunctions.projects.length; i++) {
            if (dbfunctions.projects[i].prjid == prj) {
                if (dbfunctions.projects[i].token == token) {
                    console.log(req.file);
                    response = { filedetails: req.files, message: "File Upload Successfull", status: true };
                    break;
                } else {
                    response = { filedetails: [], message: "Token missmatch", status: false };
                    break;
                }
            } else {
                response = { filedetails: [], message: "Project not found", status: false };
            }
        }
        res.json(response);
    } catch (err) {
        console.log(err)
        res.status(404).json({ message: "Please include Api Token/Token MissMatch" });
    }
})

//router.get('/get_file/:fname', (req, res) => {
router.get('/get_file', (req, res) => {
    try {
        if (req.query.fname === undefined || req.query.fname == null || req.query.fname == "") {
            res.json({ message: "Please Pass File Name in request field fname", status: false });
        }
        else {
            mongoconnection.files.findOne({ filename: req.query.fname }, (err, file) => {
                if (err) {
                    console.log(err);
                } else {
                    if (!file) {
                        return res.status(404).json({
                            err: 'file Not Exists '
                        });
                    } else {
                        console.log("entered else");
                        console.log("file Content type = " + file.contentType);
                        res.writeHead(200, { 'Content-Type': file.contentType })
                        gfs.createReadStream(file.filename).pipe(res)
                        bucket.openDownloadStreamByName(file.filename).
                            pipe(res).
                            on('error', function (error) {
                                assert.ifError(error);
                            }).
                            on('finish', function () {
                                console.log('downloading done!');
                                process.exit(0);
                            });
                    }
                }
            })
        }
    } catch (err) {
        res.status(404).json({ message: "Please include Api Token" });
    }
})

router.post('/get_file', (req, res) => {
    try {
        if (req.body.fname === undefined || req.body.fname == null || req.body.fname == "") {
            res.json({ message: "Please Pass File Name in request field fname", status: false });
        }
        else {
            console.log("file name = " + req.body.fname);
            let prj = req.headers["project"];
            let token = req.headers["token"];
            for (let i = 0; i < dbfunctions.projects.length; i++) {
                if (dbfunctions.projects[i].prjid == prj) {
                    if (dbfunctions.projects[i].token == token) {
                        gfs.files.findOne({ filename: req.body.fname }, (err, file) => {
                            //gfs.findOne({ filename: req.body.fname }, (err, file) => {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log("entered else");
                                // console.log("file length = " + file.length());
                                console.log("file Content type = " + file.contentType);
                                if (!file) {
                                    return res.status(404).json({
                                        err: 'file Not Exists '
                                    });
                                } else {
                                    res.writeHead(200, { 'Content-Type': file.contentType })
                                    let readstream = gfs.createReadStream(file.filename);
                                    readstream.pipe(res)
                                }
                            }
                        })
                        break;
                    } else {
                        res.json({ message: "Token Mismatch ", status: false });
                        break;
                    }
                } else {
                    res.json({ message: "Project Not Found", status: false });
                }
            }
        }
    } catch (err) {
        res.status(404).json({ message: "Please include Api Token" });
    }
})



module.exports = router;