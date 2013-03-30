module.exports = function(){
    var mysql = require('mysql')
        , async = require('async');
    var client;
    var public = {};
    public.init=function(cb){
        client =  mysql.createConnection({
            host: process.env.RDS_HOSTNAME,
            user: process.env.RDS_USERNAME,
            password: process.env.RDS_PASSWORD,
            port: process.env.RDS_PORT});

        async.series([
            function connect(callback) {
                client.connect(callback);
            }    ,

            function use_db(callback) {
                client.query('USE reader', callback);
            }
        ], cb
        );
    };
    public.userLoggedIn = function(_user){
        console.log('user logged in' + _user.name);
    };

    return public;
} ();

