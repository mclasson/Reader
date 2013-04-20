/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    users = require('./private/user.js'),
    twitter = require('./private/twitter.js'),
    db = require('./private/datalayer/db.js'),
    bg = require('./private/background.js'),
    MongoStore = require('connect-mongo')(express);

var app = express();
app.configure('development', function() {
    console.log('Using development settings.');
    var dev = require('./devenv.js');
    app.use(express.errorHandler());
    console.log('"' + process.env.NODE_ENV + '"');
});

app.configure(function() {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser({
        uploadDir: './public/uploads'
    }));
    app.use(express.methodOverride());
   app.use(express.cookieParser());
    app.use(express.session({
        cookie: { maxAge: 24 * 60 * 60 * 1000 },
        key : 'reedler.sid',
        secret : 'stratiteq',
        store: new MongoStore({
            db: 'reedler-sessions'
        })
    }));
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});


app.configure('production', function() {
    console.log('Using production settings.');

});

function init() {
    app.get('*', function(req, res, next) {

        var origRender = res.render;
        res.render = function(view, locals, callback) {
            if ('function' == typeof locals) {
                callback = locals;
                locals = undefined;
            }
            if (!locals) {
                locals = {};
            }
            if (!req.session.user) {
                req.session.user = {
                    id: '',
                    name: '',
                    isAuthenticated: false
                };
            }
            locals.user = req.session.user;
            console.log(req.session);
            origRender.call(res, view, locals, callback);
        };

        next();
    });


    app.get('/', routes.index);

    http.createServer(app).listen(app.get('port'), function() {
        console.log("Express server listening on port " + app.get('port'));
    });
    bg.Start();
}

app.get('/auth/twitter', function(req, res) {
    twitter.authenticate(req, res);
});

app.get('/auth/twitter/callback', function(req, res,next) {
    twitter.validate(req, res,next);
});
app.get('/api/feeds', users.feeds);
app.post('/api/opml', function(req, res) {

    console.log(req.session);
    var fs = require('fs');

    if (req.files.file && req.files.file.type === 'text/xml') {
        var Opml = require('./private/opml.js');
        var opml = new Opml();
        opml.readopml(req.session.user.localId, req.files.file.path, function(result) {
            console.log('done');
            res.redirect('/');
        });
    }


});
init();