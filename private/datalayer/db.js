module.exports = function () {
    var mysql = require('mysql')
        , async = require('async');

    var public = {};
    var pool;
    var _authorities;
    public.init = function (cb) {

        pool = pool || mysql.createPool({
            host: process.env.RDS_HOSTNAME,
            user: process.env.RDS_USERNAME,
            password: process.env.RDS_PASSWORD,
            port: process.env.RDS_PORT});
        var connection;

        async.series([
            function (callback) {
                console.log('getting connection');
                pool.getConnection(function (err, conn) {
                    console.log('got connection');
                    connection = conn;
                    callback();
                });
            },
            function (callback) {
                connection.query('USE reader', function (err) {
                    callback();
                })
            } ,
            function (callback) {
                if (_authorities) callback(); else getAuthorities(connection, callback);
            }

        ], function (err) {
                cb(connection);
            }
        );


    };

    public.addArticle = function(idfeed,articles,cb){
        if(articles && articles.length>0){
        public.init(function (client) {

            async.series([function (callback) {
                client.query('INSERT INTO articles (title,permaLink,idfeed,link) VALUES ?',[articles], function (err, result) {
                    if(err){
                        console.log(err);
                    }
                    console.log('added ' + articles.length + ' articles');
                    callback();
                });
            },
                function(callback){
                    client.query('UPDATE feeds SET latestPing = now() where idfeeds = ? ',idfeed, function (err, result) {
                        client.end();
                        callback();
                    });

                }
                ], function(){
                    cb();
                });

        });
        }
        else
        {
            cb();
        }
    };

    public.getFeedsForWorker = function(cb){

        public.init(function (client) {

            client.query('select idfeeds ,url,latestPing from feeds order by latestPing limit 10', [],
                function (error, result) {
                    if (error) {
                        throw error;
                    }



                    client.end();
                    cb(result);
                });

        });
    }
    function getAuthorities(connection, callback) {

        connection.query('select * from authorities', function (err, result) {
            if (err) throw err;
            _authorities = result;
            _authorities.find = function (name) {
                var len = _authorities.length;

                while (len--) {
                    if (_authorities[len].name === name) {
                        return _authorities[len];
                    }

                }
                return undefined;
            }

            callback();
        });


    }

    function createUser(client, _user, cb) {

        var auth = _authorities.find(_user.authority);
        var id,idcategory;
        async.series([function (callback) {
            client.query('INSERT INTO users SET ?', {authority: auth.id, username: _user.name}, function (err, result) {
                id = result.insertId;
                callback();
            })
        },
            function (callback) {
                client.query('INSERT INTO categories SET ?', {name: 'Default', iduser: id, sortorder:0}, function (err, result) {
                    idcategory = result.insertId;
                    callback();
                })
            }
,
            function (callback) {
                client.query('INSERT INTO user_feeds SET ?', {authority: auth.id, username: _user.name, idcategory:idcategory}, function (err, result) {
                    id = result.insertId;
                    callback();
                })
            }
        ], function () {
            cb(id);
        });
    }



public.getUserFeeds = function (_user, callback) {
    public.init(function (client) {

        client.query('select idfeed, feedName, url, customname,category from getUserFeeds where iduser = ?', [_user.localId],
            function (error, result) {
                if (error) {
                    throw error;
                }
                console.log('db');
                console.log(result);

                client.end();
                callback(result);
            });

    });
}

public.userLoggedIn = function (_user, callback) {
    console.log(public.init);
    public.init(function (client) {
        console.log(_authorities);
        var auth = _authorities.find(_user.authority);

        console.log('db:userLoggedIn');
        client.query('select * from users where username = ? AND authority = ?', [ _user.name, auth.id ],
            function (error, result) {
                if (error) {
                    throw error;
                }

                if (0 === result.length) {
                    createUser(client, _user, function (res) {
                        client.end();
                        callback(res.insertId);
                    });
                }
                else {
                    client.end();
                    console.log("db userisloggedin" + result[0].id);
                    callback(result[0].id);
                }
            });

    });
};

return public;
}
();

