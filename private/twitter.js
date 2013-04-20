var users = require('./user.js');

module.exports = function () {
    var OAuth = require('oauth').OAuth;
    var oa = function () {
        console.log(process.env.NODE_ENV === 'development' ? process.env.CALLBACK : "http://Reader-env-wfirpbgaxz.elasticbeanstalk.com/auth/twitter/callback");
        return new OAuth(
            "https://api.twitter.com/oauth/request_token",
            "https://api.twitter.com/oauth/access_token",
            "xNXsnRK7jMea8yAYLiYKlA",
            "qLH3sCHCVg50VksmvRdagKiBE2iPOMTGPg19As9aM",
            "1.0",
            process.env.NODE_ENV === 'development' ? process.env.CALLBACK : "http://Reader-env-wfirpbgaxz.elasticbeanstalk.com/auth/twitter/callback",
            "HMAC-SHA1"
        );
    };


    var public = {};
    public.validate = function (req, res, next) {
        console.log('validating...',req.query,req.session);
        if (req.session.oauth) {
            req.session.oauth.verifier = req.query.oauth_verifier;
            var oauth = req.session.oauth;

            oa().getOAuthAccessToken(oauth.token, oauth.token_secret, oauth.verifier,
                function (error, oauth_access_token, oauth_access_token_secret, results) {
                    if (error) {
                        console.log(error);
                        res.send("yeah something broke.");
                    } else {
                        req.session.oauth.access_token = oauth_access_token;
                        req.session.oauth.access_token_secret = oauth_access_token_secret;
                        console.log('validated: ' + results);
                        req.session.authority = 'twitter';
                        req.session.user = {
                            remoteId: results.user_id,
                            name: results.screen_name,
                            authority: 'twitter',
                            isAuthenticated: true
                        };
                        console.log('calling users.userLoggedIn');
                        users.userLoggedIn(req.session.user, function (userid) {
                            console.log("userid " + userid);
                            req.session.user.localId = userid;
                            res.redirect('/');
                        });
                    }
                }
            );
        } else
            next(new Error("you're not supposed to be here."));
    };

    public.authenticate = function (req, res) {
        oa().getOAuthRequestToken(function (error, oauth_token, oauth_token_secret, results) {
            console.log('setting request session',req.session);
            if (error) {
                console.log(error);
                res.send("yeah no. didn't work.");
            }
            else {
                req.session.oauth = {};
                req.session.oauth.token = oauth_token;

                req.session.oauth.token_secret = oauth_token_secret;

                console.log('setting request session',req.session);
                res.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token);
                return;
            }
        });
    };
    return public;

}();

