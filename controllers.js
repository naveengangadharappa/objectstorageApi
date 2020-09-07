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
let mongouri = 'mongodb://localhost:27017/object_storage naveen -u 1BI16cs413 -p --auth';
let gfs;

let conn = mongoose.createConnection(mongouri);
let bktname = 'Ipas';
conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection(bktname);
    console.log('bucket initalised');
})


let storage = new GridFsStorage({
    url: mongouri,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
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
                    bucketName: req.headers["project"],
                };
                console.log("inserting fie");
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



const uploadFilter = (req, file, cb) => {
    let prj = req.headers["project"];
    let token = req.headers["token"];
    let projects = dbfunctions.projectsjson.projects;
    let project = projects.filter(prjdata => {
        if (prjdata.prjid == prj) { return prjdata }
    })
    console.log("project =", (project));
    if (project.length > 0 && token == project[0].token) {
        gfs.collection(req.headers["project"]);
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const upload = multer({
    storage: storage,
    fileFilter: uploadFilter,
});
const upload1 = multer({
    storage: storage,
    fileFilter: uploadFilter,
}).single('file');

const arrUpload = upload.array('file', 2);

router.get('/', (req, res) => {
    try {
        /*let prj = req.headers["project"];
        let token = req.headers["token"];
        let project = dbfunctions.projects.filter(prjdata => {
            if (prjdata.prjid == prj) { return prjdata }
        })
        console.log("project =", (project));
        let response = project.length > 0 ? token == project[0].token ? { message: "Connected to object storage of " + prj, status: true } : { message: "Token Mismatch ", status: false } : { message: "Project not found ", status: false }
        res.json(response);*/
        dbfunctions.loadprojects().then(result => {
            res.json({ message: "Successfully Connected to object storage, Welcome !!!!!", status: true });
        }).catch(err => {
            console.log(err);
        })
    } catch (err) {
        console.log(err);
        res.json({ message: "Error in connecting to object storage" });
    }
});


//router.post('/upload_file',upload.single('file'),(req,res)=>{
router.post('/upload_file', upload1, (req, res) => {
    try {
        console.log("entering to response");
        let prj = req.headers["project"];
        let token = req.headers["token"];
        let projects = dbfunctions.projectsjson.projects;
        let project = projects.filter(prjdata => {
            if (prjdata.prjid == prj) { return prjdata }
        })
        let response = project.length > 0 ?
            token == project[0].token ?
                req.file == undefined ? { message: "Sorry File Upload UnSuccessfull", status: false } : { filedetails: req.file, message: "Files Upload Successfull", status: true }
                : { message: "Token Mismatch ", status: false }
            : { message: "Project not found ", status: false }
        res.json(response);
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: "Please include Api Token" });
    }
});


router.post('/upload_files', arrUpload, (req, res, next) => {
    try {
        console.log("entering to response");
        let prj = req.headers["project"];
        let token = req.headers["token"];
        let projects = dbfunctions.projectsjson.projects;
        let project = projects.filter(prjdata => {
            if (prjdata.prjid == prj) { return prjdata }
        })
        let response = project.length > 0 ?
            token == project[0].token ?
                req.files.length <= 0 ? { message: "Sorry File Upload UnSuccessfull", status: false } : { filedetails: req.files, message: "Files Upload Successfull", status: true }
                : { message: "Token Mismatch ", status: false }
            : { message: "Project not found ", status: false }
        res.json(response);
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: "Please include Api Token" });
    }
})


router.get('/get_file', (req, res) => {
    try {
        let prj = req.headers["project"];
        let token = req.headers["token"];
        let projects = dbfunctions.projectsjson.projects;
        let project = projects.filter(prjdata => {
            if (prjdata.prjid == prj) { return prjdata }
        })
        if (project.length > 0 && token == project[0].token) {
            gfs.collection(req.headers["project"]);
            gfs.files.findOne({ filename: req.query.fname }, (err, file) => {
                if (err) {
                    console.log(err);
                } else {
                    if (!file) {
                        return res.status(404).json({
                            message: 'file Not Exists ',
                            status: false
                        });
                    } else {
                        console.log(file);
                        res.writeHead(200, { 'Content-Type': file.contentType });
                        let readstream = gfs.createReadStream({ filename: file.filename });
                        readstream.pipe(res);
                    }
                }
            })
        } else {
            res.json(project.length > 0 ? { message: "Token Mismatch ", status: false } : { message: "Project not found ", status: false })
        }
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: "Please include Api Token" });
    }
})

router.post('/get_file', (req, res) => {
    try {
        let prj = req.headers["project"];
        let token = req.headers["token"];
        let projects = dbfunctions.projectsjson.projects;
        let project = projects.filter(prjdata => {
            if (prjdata.prjid == prj) { return prjdata }
        })
        if (project.length > 0 && token == project[0].token) {
            gfs.collection(req.headers["project"]);
            gfs.files.findOne({ filename: req.body.fname }, (err, file) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(file);
                    if (!file) {
                        return res.status(404).json({
                            message: 'file Not Exists ',
                            status: false
                        });
                    } else {
                        res.writeHead(200, { 'Content-Type': file.contentType });
                        let readstream = gfs.createReadStream({ filename: file.filename });
                        readstream.pipe(res);
                    }
                }
            })
        } else {
            res.json(project.length > 0 ? { message: "Token Mismatch ", status: false } : { message: "Project not found ", status: false })
        }
    } catch (err) {
        res.status(404).json({ message: "Please include Api Token" });
    }
})

router.get('/get_live_stream', (req, res) => {
    try {
        console.log("fname =" + req.query.fname)
        var trackID = new ObjectID(req.query.fname);
        console.log("trackid=" + trackID);
    } catch (err) {
        return res.status(400).json({ message: "Invalid trackID in URL parameter. Must be a single String of 12 bytes or a string of 24 hex characters" });
    }
    res.set('content-type', 'audio/mp3');
    res.set('accept-ranges', 'bytes');

    let bucket = new mongodb.GridFSBucket(mongoconnection, {
        bucketName: bktname
    });

    let downloadStream = bucket.openDownloadStream(trackID);

    downloadStream.on('data', (chunk) => {
        res.write(chunk);
    });

    downloadStream.on('error', () => {
        res.sendStatus(404);
    });

    downloadStream.on('end', () => {
        res.end();
    });
});


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
        let sess = req.session;
        let token = req.headers['token'];
        if (token == sess.token) {
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
        let sess = req.session;
        let token = req.headers['token'];
        if (token == sess.token) {
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

router.post('/deleteProject', (req, res) => {
    try {
        let sess = req.session;
        let token = req.headers['token'];
        if (token == sess.token) {
            dbfunctions.deleteprojects(req).then((result) => {
                if (result.status) {
                    res.status(200).json(result);
                } else {
                    res.status(200).json(result);
                }
            }).catch((err) => {
                console.log(err);
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
        dbfunctions.userlogin(req).then((result) => {
            if (result.status) {
                sess.uid = req.body.uid;
                sess.token = result.token;
                console.log(sess.uid);
                console.log(sess.token);
                res.status(200).json(result);
            } else {
                res.status(200).json({ message: result.msg, status: false });
            }
        }).catch((err) => {
            console.log(err);
            res.status(500).json({ message: "Data base error", status: false });
        })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Please include Api Token", status: false });
    }
})


router.post('/requestProjectApproval', (req, res) => {
    try {
        let sess = req.session;
        let token = req.headers['token'];
        if (token == sess.token) {
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
        if (token == sess.token) {
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
        let sess = req.session;
        let token = req.headers['token'];
        if (token == sess.token) {
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
        let sess = req.session;
        let token = req.headers['token'];
        if (token == sess.token) {
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
        let sess = req.session;
        let token = req.headers['token'];
        if (token == sess.token) {
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
        if (token == sess.token) {
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
        let sess = req.session;
        let token = req.headers['token'];
        if (token == sess.token) {
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
