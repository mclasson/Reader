var db = require('./datalayer/db.js')
module.exports = function(){

    var public = {};
    public.userLoggedIn = function(_user,callback){
        db.userLoggedIn(_user,callback);
    };
    public.feeds = function(req,res){
        db.getUserFeeds(req.session.user,function(result){

            res.json({feeds: result });
        });

    };
    return public;
}();

