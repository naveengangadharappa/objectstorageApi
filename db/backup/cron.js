var CronJob = require('cron').CronJob;
var Cron = require('./mongodb_backup');
new CronJob('0 0 0 * * *', function() {
    Cron.dbAutoBackUp();
}, null, true, 'E:/node_js');


/*   * * * * * *
     | | | | | |
     | | | | | day of week
     | | | | month
     | | | day of month
     | | hour
     | minute
     second ( optional )*/