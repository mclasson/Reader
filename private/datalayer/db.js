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

                pool.getConnection(function (err, conn) {

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

    public.mergeFeeds = function (iduser, feeds, cb) {
        if (feeds && feeds.length > 0) {
            public.init(function (client) {
                async.series([
                    function (callback) {
                        client.query('BEGIN');
                        client.query('CREATE TEMPORARY TABLE urls_' + iduser + ' (name varchar(500),url varchar(1000), idcategory int)');
                        client.query('INSERT INTO urls_10 (url,name,idcategory) VALUES ?', [feeds]);
                        client.query('INSERT INTO feeds (name,url) (SELECT urls_' + iduser + '.name,urls_' + iduser + '.url FROM urls_' + iduser + ' LEFT JOIN feeds on urls_' + iduser + '.url = feeds.url WHERE idfeeds IS NULL);');
                        client.query('INSERT IGNORE INTO user_feeds (idfeed,idcategory,iduser) (SELECT feeds.idfeeds,urls_' + iduser + '.idcategory,' + iduser + ' FROM urls_' + iduser + ' JOIN feeds on urls_' + iduser + '.url = feeds.url)');
                        client.query('DROP table urls_' + iduser);
                        client.query('COMMIT', function (err, result) {
                            if (err) {
                                console.log(err);
                                client.end();
                                cb(err);
                            }

                            callback();

                        });


                    }, function (callback) {


                        client.end();
                        callback();
                    }], function () {
                    cb();
                });
            });
        } else {
            cb(new Error('no feeds'));
        }


    };

    public.addFolders = function (iduser, folders, cb) {
        if (folders && folders.length > 0) {
            public.init(function (client) {
                var _folders = [], _newfolders = [];
                async.series([
                    function (callback) {
                        client.query('INSERT IGNORE INTO categories (name,iduser,sortorder) VALUES ("",?,0)', iduser);
                        client.query('SELECT name FROM categories WHERE iduser  = ? ', [iduser], function (err, result) {
                            if (err) {
                                client.end();
                                console.log(err);
                                cb(error);
                            }
                            var count = result.length;
                            while (count--) {
                                _folders.push(result[count].name);
                            }


                            callback();
                        });

                    },
                    function (callback) {
                        var count = folders.length;
                        while (count--) {
                            _newfolders.push([folders[count], iduser, 1000]);
                        }

                        callback();

                    },
                    function (callback) {
                        if (_newfolders.length > 0) {
                            client.query('INSERT IGNORE INTO categories (name,iduser,sortorder) VALUES ?', [_newfolders], function (err, result) {
                                if (err) {
                                    console.log(err);
                                    client.end();
                                    cb(err);
                                }
                                callback();
                            })
                        } else {

                            callback();
                        }

                    },
                    function (callback) {
                        client.query('SELECT * FROM categories WHERE iduser  = ?', [iduser], function (err, result) {
                            client.end();
                            if (err) {

                                console.log(err);
                                cb(error);
                            }
                            _folders = result;

                            callback();
                        });

                    }], function () {
                    cb(null, _folders);
                });
            });
        } else {
            cb(new Error('no folders'));
        }
    };

    public.resetPing = function (idfeed, cb) {
        public.init(function (client) {
            client.query('UPDATE feeds SET latestPing = now() where idfeeds = ? ', idfeed, function (err, result) {
                if(err)
                    console.log('resetPing', err);

                client.end();
                cb();
            });

        });

    }

    public.killFeed = function (idfeed, cb) {
        public.init(function (client) {
            client.query('UPDATE feeds SET dead = 1 where idfeeds = ? ', idfeed, function (err, result) {
                if(err)
                    console.log('killFeed', err);

                client.end();
                cb();
            });

        });

    }

    public.addArticle = function (idfeed, articles, cb) {
        if (articles && articles.length > 0) {
            public.init(function (client) {

                client.query('UPDATE feeds SET latestPing = now() where idfeeds = ? ', idfeed);
                client.query('INSERT INTO articles (title,permaLink,idfeed,link) VALUES ?', [articles], function (err, result) {
                    if (err) {

                        console.log('addArticle', err);
                    }
                    client.end();
                    cb();
                });

            });
        }
        else {
            cb();
        }
    };

    public.getFeedsForWorker = function (cb) {

        public.init(function (client) {

            client.query('select idfeeds ,url,latestPing,name from feeds where dead =0 order by latestPing limit 10', [],
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
        var id, idcategory;
        async.series([function (callback) {
            client.query('INSERT INTO users SET ?', {authority: auth.id, username: _user.name}, function (err, result) {
                id = result.insertId;
                callback();
            })
        },
            function (callback) {
                client.query('INSERT INTO categories SET ?', {name: 'Default', iduser: id, sortorder: 0}, function (err, result) {
                    idcategory = result.insertId;
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

