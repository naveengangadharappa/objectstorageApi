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

let conn = mongoose.createConnection(mongouri);
let bktname = 'Ipas';
conn.once('open', () => {
    //initaling stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection(bktname);
    console.log('bucket initalised');
})


let storage = new GridFsStorage({
    url: mongouri,
    //url:getdburl(req),
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileinfo = {
                    filename: filename,
                    //bucketName: 'file-objects'
                    bucketName: "Ipas"
                };
                dbfunctions.insertfiles(filename, file.originalname, req.headers["project"], "").then((result) => {
                    if (result) {
                        resolve(fileinfo);
                    }
                }).catch((err) => {
                    console.log(err);
                    reject("DB error");
                });

            });
        });
    }
});

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
        console.log(req.query.fname);
        if (req.query.fname === undefined || req.query.fname == null || req.query.fname == "") {
            res.json({ message: "Please Pass File Name in request field fname", status: false });
        }
        else {
            console.log(req.query.fname);
            gfs.files.findOne({ filename: req.query.fname }, (err, file) => {
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
                        if (file.contentType === "image/jpeg" || file.contentType === "image/png") {
                            res.writeHead(200, { 'Content-Type': file.contentType })
                            let readstream = gfs.createReadStream(file.filename);
                            //res.pipe(readstream);
                            readstream.pipe(res)
                        } else {
                            console.log(file.filename);
                            res.writeHead(200, { 'Content-Type': file.contentType })
                            let readstream = gfs.createReadStream(file.filename);
                            //res.pipe(readstream);
                            readstream.pipe(res)
                        }
                    }
                }
            })
            /*let prj = req.headers["project"];
            let token = req.headers["token"];
            for (let i = 0; i < dbfunctions.projects.length; i++) {
                if (dbfunctions.projects[i].prjid == prj) {
                    if (dbfunctions.projects[i].token == token) {
                        gfs.files.findOne({ filename: req.query.fname }, (err, file) => {
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
                                    if (file.contentType === "image/jpeg" || file.contentType === "image/png") {
                                        let readstream = gfs.createReadStream(file.filename);
                                        readstream.pipe(res)
                                    } else {
                                        let readstream = gfs.createReadStream(file.filename);
                                        readstream.pipe(res)
                                    }
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
            }*/
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
                                    if (file.contentType === "image/jpeg" || file.contentType === "image/png") {
                                        let readstream = gfs.createReadStream(file.filename);
                                        readstream.pipe(res)
                                    } else {
                                        let readstream = gfs.createReadStream(file.filename);
                                        readstream.pipe(res)
                                    }
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

router.post('/get_live_stream', (req, res) => {
    try {
        if (req.body.fname === undefined || req.body.fname == null || req.body.fname == "") {
            res.json({ message: "Please Pass File Name in request field fname", status: false });
        }
        else {
            let prj = req.headers["project"];
            let token = req.headers["token"];
            for (let i = 0; i < dbfunctions.projects.length; i++) {
                if (dbfunctions.projects[i].prjid == prj) {
                    if (dbfunctions.projects[i].token == token) {
                        bktname = dbfunctions.projects[i].dbbucket;
                        console.log(gfs.files);
                        gfs.files.findOne({ filename: req.body.fname }, (err, file) => {
                            if (err) {
                                console.log(err);
                            } else {
                                if (!file || file.length === 0) {
                                    return res.status(404).json({
                                        err: 'file Not Exists '
                                    });
                                } else {

                                    if (file.contentType === "video/mp4") {
                                        res.writeHead(200, { 'Content-Type': 'video/mp4' })
                                        let readstream = gfs.createReadStream(file.filename);
                                        readstream.pipe(res)
                                    } else if (file.contentType === "audio/mp3") {
                                        res.writeHead(200, { 'Content-Type': 'audio/mp3' })
                                        let readstream = gfs.createReadStream(file.filename);
                                        readstream.pipe(res)
                                    }
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










router.get('/get_Allfiledetails', (req, res) => {
    try {
        let prj = req.headers["project"];
        let token = req.headers["token"];
        for (let i = 0; i < dbfunctions.projects.length; i++) {
            if (dbfunctions.projects[i].prjid == prj) {
                if (dbfunctions.projects[i].token == token) {
                    bktname = dbfunctions.projects[i].dbbucket;
                    conn.once('open', () => {
                        //initaling stream
                        gfs = Grid(conn.db, mongoose.mongo);
                        gfs.collection(bktname);
                        console.log("stream initalized");
                    })
                    console.log("enterd to stream initalized");
                    gfs.files.find().toArray((err, files) => {
                        //check if files
                        if (!files || files.length === 0) {
                            return res.status(404).json({
                                err: 'file Not Exists '
                            });
                        } else {
                            return res.json(files);
                        }
                    })
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
        res.status(404).json({ message: "Please include Api Token" });
    }
})

router.post('/get_Allfiledetails', (req, res) => {
    try {
        let prj = req.headers["project"];
        let token = req.headers["token"];
        for (let i = 0; i < dbfunctions.projects.length; i++) {
            if (dbfunctions.projects[i].prjid == prj) {
                if (dbfunctions.projects[i].token == token) {
                    conn.once('open', () => {
                        //initaling stream
                        gfs = Grid(conn.db, mongoose.mongo);
                        gfs.collection(bktname);
                    })
                    gfs.files.find().toArray((err, files) => {
                        //check if files
                        if (!files || files.length === 0) {
                            return res.status(404).json({
                                err: 'file Not Exists '
                            });
                        } else {
                            return res.json(files);
                        }
                    })
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
        res.status(404).json({ message: "Please include Api Token" });
    }
})

router.post('/insertuser', (req, res) => {
    try {
        let token = req.headers['token'];
        if (token == "mytoken") {
            dbfunctions.insertuser(req).then((result) => {
                if (result) {
                    res.status(200).json({ message: "Insert sucessfull", status: true });
                } else {
                    res.status(200).json({ message: "User Already exists", status: false });
                }
            }).catch((err) => {
                //console.log(err);
                res.status(500).json({ message: "Data base error", status: false });
            })
        } else {
            res.status(404).json({ message: "Token MissMatch", status: false });
        }
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: "Please include Api Token", status: false });
    }
})

router.post('/insertProject', (req, res) => {
    try {
        let token = req.headers['token'];
        if (token == "mytoken") {
            dbfunctions.insertprojects(req).then((result) => {
                if (result.status) {
                    res.status(200).json(result);
                } else {
                    res.status(200).json(result);
                }
            }).catch((err) => {
                //console.log(err);
                res.status(500).json({ message: "Data base error", status: false });
            })
        } else {
            res.status(404).json({ message: "Token MissMatch", status: false });
        }
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: "Please include Api Token", status: false });
    }
})

router.post('/Login', (req, res) => {
    try {
        let sess = req.session;
        let token = req.headers['token'];
        if (token == "mytoken") {
            dbfunctions.userlogin(req).then((result) => {
                if (result.status) {
                    sess.uid = req.body.uid;
                    console.log(sess.uid);
                    res.status(200).json({ message: result.msg, status: true });
                } else {
                    res.status(200).json({ message: result.msg, status: false });
                }
            }).catch((err) => {
                //console.log(err);
                res.status(500).json({ message: "Data base error", status: false });
            })
        } else {
            res.status(500).json({ message: "Token MissMatch", status: false });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Please include Api Token", status: false });
    }
})


router.post('/requestProjectApproval', (req, res) => {
    try {
        let sess = req.session;
        let token = req.headers['token'];
        if (token == "mytoken") {
            console.log("Uid = " + sess.uid);
            dbfunctions.insertmapping(req, sess.uid).then((result) => {
                if (result.status) {
                    res.status(200).json(result);
                } else {
                    res.status(200).json(result);
                }
            }).catch((err) => {
                //console.log(err);
                res.status(500).json({ message: "Data base error", status: false });
            })
        } else {
            res.status(404).json({ message: "Token MissMatch", status: false });
        }
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: "Please include Api Token", status: false });
    }
})

//Approval of project requested by users
router.post('/ProjectApproval', (req, res) => {
    try {
        let sess = req.session;
        let token = req.headers['token'];
        if (token == "mytoken") {
            dbfunctions.updateprojectmapping(req).then((result) => {
                if (result.status) {
                    res.status(200).json(result);
                } else {
                    res.status(200).json(result);
                }
            }).catch((err) => {
                //console.log(err);
                res.status(500).json({ message: "Data base error", status: false });
            })
        } else {
            res.status(404).json({ message: "Token MissMatch", status: false });
        }
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: "Please include Api Token", status: false });
    }
})

router.post('/getAllUsers', (req, res) => {
    try {
        let token = req.headers['token'];
        if (token == "mytoken") {
            dbfunctions.getAllusers().then((result) => {
                if (result.status) {
                    res.status(200).json(result);
                } else {
                    res.status(200).json(result);
                }
            }).catch((err) => {
                //console.log(err);
                res.status(500).json({ message: "Data base error", status: false });
            })
        } else {
            res.status(404).json({ message: "Token MissMatch", status: false });
        }
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: "Please include Api Token", status: false });
    }
})

router.post('/getAllProjects', (req, res) => {
    try {
        let token = req.headers['token'];
        if (token == "mytoken") {
            dbfunctions.getAllprojects().then((result) => {
                if (result.status) {
                    res.status(200).json(result);
                } else {
                    res.status(200).json(result);
                }
            }).catch((err) => {
                //console.log(err);
                res.status(500).json({ message: "Data base error", status: false });
            })
        } else {
            res.status(404).json({ message: "Token MissMatch", status: false });
        }
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: "Please include Api Token", status: false });
    }
})

router.post('/getAllManagers', (req, res) => {
    try {
        let token = req.headers['token'];
        if (token == "mytoken") {
            dbfunctions.getAllMgrs().then((result) => {
                if (result.status) {
                    res.status(200).json(result);
                } else {
                    res.status(200).json(result);
                }
            }).catch((err) => {
                //console.log(err);
                res.status(500).json({ message: "Data base error", status: false });
            })
        } else {
            res.status(404).json({ message: "Token MissMatch", status: false });
        }
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: "Please include Api Token", status: false });
    }
})

router.post('/getUserProjects', (req, res) => {
    try {
        let sess = req.session;
        let token = req.headers['token'];
        if (token == "mytoken") {
            dbfunctions.getuserprj(sess.uid).then((result) => {
                if (result.status) {
                    res.status(200).json(result);
                } else {
                    res.status(200).json(result);
                }
            }).catch((err) => {
                //console.log(err);
                res.status(500).json({ message: "Data base error", status: false });
            })
        } else {
            res.status(404).json({ message: "Token MissMatch", status: false });
        }
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: "Please include Api Token", status: false });
    }
})

router.post('/logout', (req, res) => {
    try {
        let token = req.headers['token'];
        if (token == "mytoken") {
            req.session.destroy((err) => {
                if (err) {
                    return console.log(err);
                } else {
                    res.json({ message: "User Logout", status: true });
                }
            });
        } else {
            res.status(404).json({ message: "Token MissMatch", status: false });
        }
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: "Please include Api Token", status: false });
    }
})



router.post('/backupAll', (req, res) => {
    try {
        console.log("Enterd Back Up");
        backup.dbAutoBackUp().then((result) => {
            res.json({ message: "Back Up Successfull" });
        }).catch((err) => {
            console.log("Backup successfull");
            res.json({ message: "Back Up unsuccessfull" });
        });
    } catch (err) {
        console.log(err);
        res.json({ message: "Back Up unsuccessfull with error" });
    }
})

router.post('/backup', (req, res) => {
    try {
        console.log("Enterd Back Up");

        backup.CollectionAutoBackUp(req.body.bucket_name).then((result) => {
            if (result.status) {
                res.json({ message: result.msg, status: true });
            } else {
                res.json({ message: result.msg, status: false });
            }
        }).catch((err) => {
            console.log("Backup successfull for " + req.body.bucket_name);
            res.json({ message: "Back Up unsuccessfull" });
        });
    } catch (err) {
        console.log(err);
        res.json({ message: "Back Up unsuccessfull with error" });
    }
})





module.exports = router;
