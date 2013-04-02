var db = require('./datalayer/db.js')
module.exports = function(){

    var public = {};
    public.userLoggedIn = function(_user){
        db.userLoggedIn(_user);
    };
    public.feeds = function(req,res){
        res.json({feeds: [{displayname: 'test', id:45}]});
    };
    return public;
}();

