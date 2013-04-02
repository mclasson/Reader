
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  ,users=require('./private/user.js')
  ,twitter = require('./private/twitter.js')
    ,db = require('./private/datalayer/db.js');

var app = express();
app.configure('development', function() {
    console.log('Using development settings.');
    var dev = require('./devenv.js');
    app.use(express.errorHandler());
});

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
    app.use(express.cookieParser('Df45tYLBnmi1+0dLibMN'));
    app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});



app.configure('production', function() {
    console.log('Using production settings.');

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

    http.createServer(app).listen(app.get('port'), function(){
      console.log("Express server listening on port " + app.get('port'));
    });

}

app.get('/auth/twitter',twitter.authenticate);

app.get('/auth/twitter/callback', twitter.validate);
app.get('/api/feeds', users.feeds);
init();



