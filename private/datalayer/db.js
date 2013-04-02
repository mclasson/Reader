module.exports = function(){
    var mysql = require('mysql')
        , async = require('async');

    var public = {};
    var pool;
    var _authorities;
    public.init=function(cb){

        pool = pool || mysql.createPool({
            host: process.env.RDS_HOSTNAME,
            user: process.env.RDS_USERNAME,
            password: process.env.RDS_PASSWORD,
            port: process.env.RDS_PORT});
        var connection;

        async.series([
            function(callback){pool.getConnection(function(err, conn){connection=conn;callback();});},
            function(callback){connection.query('USE reader',function(err){callback();})} ,
            function(callback){if(_authorities) callback(); else getAuthorities(connection,callback);}

            ],function(err){
                cb(connection);
            }
        );




    };



    function getAuthorities(connection,callback)
    {

            connection.query('select * from authorities', function(err, result) {
                if (err) throw err;
                _authorities = result;
                _authorities.find = function(name){
                    var len = _authorities.length;

                    while(len--){
                        if(_authorities[len].name === name){
                            return _authorities[len];
                        }

                    }
                    return undefined;
                }

                callback();
            });


    }
    function createUser(client,_user,callback){

            var auth = _authorities.find(_user.authority);
        console.log(auth.id);
            client.query('INSERT INTO users SET ?', {authority: auth.id, username:_user.name}, function(err, result) {
                if (err) throw err;

                console.log('insert'  + result.insertId);
                callback(result);
            });

    }
    public.userLoggedIn = function(_user){

        public.init(function(client)
        {

            var auth = _authorities.find(_user.authority);


            client.query('select * from users where username = ? AND authority = ?', [ _user.name, auth.id ],
                function(error, result) {
                    if(error)
                    {
                        throw error;
                    }
                    console.log(result) ;
                   if(0===result.length){
                    createUser(client,_user,function(result){
                       client.end();
                    });
                   }
                });

        });
    };

    return public;
} ();

