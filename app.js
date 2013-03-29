
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , hike = require('./routes/hike')
  , mysql = require('mysql')
  , async = require('async')

    ,twitter = require('./twitter.js');


var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
    app.use(express.cookieParser('your secret here'));
    app.use(express.session({ secret: 'Peppermint Twist'}));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
    console.log('Using development settings.');

    app.set('connection', mysql.createConnection({
        host: 'localhost',
        user: 'node',
        port: '3306',
        password: 'Peppermint2012'}));
    app.use(express.errorHandler());
});

app.configure('production', function() {
    console.log('Using production settings.');
    app.set('connection', mysql.createConnection({
        host: process.env.RDS_HOSTNAME,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        port: process.env.RDS_PORT}));
});
function init() {
    app.get('*',function(req, res, next){

        var origRender = res.render;
        res.render = function (view, locals, callback) {
            if ('function' == typeof locals) {
                callback = locals;
                locals = undefined;
            }
            if (!locals) {
                locals = {};
            }
            if(!req.session.user){
                req.session.user={id:'',name:'',isAuthenticated:false};
            }
            locals.user = req.session.user;
            console.log(req.session);
            origRender.call(res, view, locals, callback);
        };

        next();
    });
    app.get('/', routes.index);
    app.get('/users', user.list);
    app.get('/hikes', hike.index);
    app.post('/add_hike', hike.add_hike);

    http.createServer(app).listen(app.get('port'), function(){
      console.log("Express server listening on port " + app.get('port'));
    });

}

app.get('/auth/twitter',twitter.authenticate);

app.get('/auth/twitter/callback', twitter.validate);


var client = app.get('connection');
async.series([
    function connect(callback) {
        client.connect(callback);
    }    ,

    function use_db(callback) {
        client.query('USE Reader', callback);
    }
], function (err, results) {
    if (err) {
        console.log(process.env.RDS_PASSWORD + 'Exception initializing database.');
        throw err;
    } else {
        console.log('Database initialization complete.');
        init();
    }
});
