require('./db/db_connect');

const express = require('express');
const path = require('path');
const session = require('express-session');
//const exphbs=require('express-handlebars');
const controller = require('./controllers');
//const controller2 = require('./controller2');
var app = express();

const bodyparser = require('body-parser');
app.use(bodyparser.json());

app.use(bodyparser.urlencoded({
    extended: true
}));

app.use(bodyparser.json());

app.use(session({ secret: 'ssshhhhh' }));
/*app.set('views',path.join(__dirname,'/views/'));
app.engine('hbs',exphbs({extname:'hbs',defaultLayout:'mainLayout', layoutsDir:__dirname+'/views/layouts/'}));
app.set('view engine','hbs');*/
//app.use('/', controller);
app.use('/', controller);

app.listen(3000, () => {
    console.log("Express server started at port : 3000");
});

