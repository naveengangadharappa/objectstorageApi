var fs = require('fs');
var _ = require('lodash');
var exec = require('child_process').exec;

var dbOptions = {
    user: 'root',
    pass: 'root',
    host: 'localhost',
    port: 27017,
    database: 'object_storage',
    autoBackup: true,
    removeOldBackup: true,
    keepLastDaysBackup: 2,
    autoBackupPath: 'E:/node_js/' // i.e. /var/database-backup/
};

/* return date object */
function stringToDate(dateString) {
    return new Date(dateString);
}

/* return if variable is empty or not. */
function empty(mixedVar) {
    var undef, key, i, len;
    var emptyValues = [undef, null, false, 0, '', '0'];
    for (i = 0, len = emptyValues.length; i < len; i++) {
        if (mixedVar === emptyValues[i]) {
            return true;
        }
    }
    if (typeof mixedVar === 'object') {
        for (key in mixedVar) {
            return false;
        }
        return true;
    }
    return false;
};


// Auto backup script

function dbAutoBackUp() {
    // check for auto backup is enabled or disabled
    return new Promise((resolve, reject) => {
        if (dbOptions.autoBackup == true) {
            var date = new Date();
            var beforeDate, oldBackupDir, oldBackupPath;
            currentDate = stringToDate(date); // Current date
            var newBackupDir = currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1) + '-' + currentDate.getDate();
            var newBackupPath = dbOptions.autoBackupPath + 'mongodump-' + newBackupDir;
            console.log("backup Path = " + newBackupPath) // New backup path for current backup process
            // check for remove old backup after keeping # of days given in configuration
            if (dbOptions.removeOldBackup == true) {
                beforeDate = _.clone(currentDate);
                beforeDate.setDate(beforeDate.getDate() - dbOptions.keepLastDaysBackup); // Substract number of days to keep backup and remove old backup
                oldBackupDir = beforeDate.getFullYear() + '-' + (beforeDate.getMonth() + 1) + '-' + beforeDate.getDate();
                oldBackupPath = dbOptions.autoBackupPath + 'mongodump-' + oldBackupDir; // old backup(after keeping # of days)
            }
            //var cmd = 'mongodump --host ' + dbOptions.host + ' --port ' + dbOptions.port + ' --db ' + dbOptions.database + ' --username ' + dbOptions.user + ' --password ' + dbOptions.pass + ' --out ' + newBackupPath; // Command for mongodb dump process
            var cmd = 'mongodump --host ' + dbOptions.host + ' --port ' + dbOptions.port + ' --db ' + dbOptions.database + ' --out ' + newBackupPath; // Command for mongodb dump process

            exec(cmd, function (error, stdout, stderr) {
                if (error) {
                    console.log(error);
                    reject(error);
                }
                /**/
                else {
                    if (empty(error)) {
                        // check for remove old backup after keeping # of days given in configuration
                        if (dbOptions.removeOldBackup == true) {
                            if (fs.existsSync(oldBackupPath)) {
                                exec("rm -rf " + oldBackupPath, function (err) { reject(err); });
                            }
                        }
                    }
                    resolve(" successfull");
                }
            });
        }
    });
}

function CollectionAutoBackUp(collection_name) {
    // check for auto backup is enabled or disabled
    return new Promise((resolve, reject) => {
        let prjfile = collection_name + ".files";
        let prjchunks = collection_name + ".chunks";
        if (dbOptions.autoBackup == true) {
            var date = new Date();
            var beforeDate, oldBackupDir, oldBackupPath;
            currentDate = stringToDate(date); // Current date
            var newBackupDir = currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1) + '-' + currentDate.getDate() + "_" + collection_name;
            var newBackupPath = dbOptions.autoBackupPath + 'mongodump-' + newBackupDir;
            console.log("backup Path = " + newBackupPath + '/' + prjfile + '.json'); // New backup path for current backup process
            // check for remove old backup after keeping # of days given in configuration
            if (dbOptions.removeOldBackup == true) {
                beforeDate = _.clone(currentDate);
                beforeDate.setDate(beforeDate.getDate() - dbOptions.keepLastDaysBackup); // Substract number of days to keep backup and remove old backup
                oldBackupDir = beforeDate.getFullYear() + '-' + (beforeDate.getMonth() + 1) + '-' + beforeDate.getDate() + "_" + collection_name;
                oldBackupPath = dbOptions.autoBackupPath + 'mongodump-' + oldBackupDir; // old backup(after keeping # of days)
            }
            //var cmd = 'mongodump --host ' + dbOptions.host + ' --port ' + dbOptions.port + ' --db ' + dbOptions.database + ' --username ' + dbOptions.user + ' --password ' + dbOptions.pass + ' --out ' + newBackupPath; // Command for mongodb dump process
            //let cmd = 'mongodump --host ' + dbOptions.host + ' --port ' + dbOptions.port + ' --db ' + dbOptions.database +' --out ' + newBackupPath; // Command for mongodb dump process
            let cmd = 'mongoexport --db object_storage --collection ' + prjfile + ' --out ' + newBackupPath + '/' + prjfile + '.json';
            exec(cmd, function (error, stdout, stderr) {
                if (error) {
                    console.log(error);
                    reject(error);
                }
                /**/
                else {
                    if (stderr) {
                        console.log(stderr);
                    }
                    console.log("files bkp created");
                    cmd = 'mongoexport --db object_storage --collection ' + collection_name + ' --out ' + newBackupPath + '/' + prjchunks + '.json';
                    exec(cmd, function (error, stdout, stderr) {
                        if (error) {
                            console.log(error);
                            reject(error);
                        }
                        else {
                            if (stderr) {
                                console.log(stderr);
                            }
                            console.log("chunks bkp created");
                            if (empty(error)) {
                                // check for remove old backup after keeping # of days given in configuration
                                if (dbOptions.removeOldBackup == true) {
                                    if (fs.existsSync(oldBackupPath)) {
                                        exec("rm -rf " + oldBackupPath, function (err) { reject(err); });
                                    }
                                }
                            }
                            resolve({ msg: " Collection bakup successfull", status: true });
                        }
                    });
                }
            });
        }
    });
}


module.exports = { dbAutoBackUp, empty, CollectionAutoBackUp }