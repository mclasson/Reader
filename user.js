var db = require('./datalayer/db.js')
module.exports = function(){

    var public = {};
    public.userLoggedIn = function(_user){
        db.init(function (err, results) {
            if (err) {
                console.log(process.env.RDS_PASSWORD + 'Exception initializing database.');
                throw err;
            } else {
                console.log('Database initialization complete.');
                db.userLoggedIn(_user);


            }});

    };
    return public;
}();

