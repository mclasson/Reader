var OAuth= require('oauth').OAuth;
var oa = new OAuth(
    "https://api.twitter.com/oauth/request_token",
    "https://api.twitter.com/oauth/access_token",
    "xNXsnRK7jMea8yAYLiYKlA",
    "qLH3sCHCVg50VksmvRdagKiBE2iPOMTGPg19As9aM",
    "1.0",
    "http://dev.ontargo.se:3000/auth/twitter/callback",
    "HMAC-SHA1"
);

exports.validate = function(req, res, next){
    if (req.session.oauth) {
        req.session.oauth.verifier = req.query.oauth_verifier;
        var oauth = req.session.oauth;

        oa.getOAuthAccessToken(oauth.token,oauth.token_secret,oauth.verifier,
            function(error, oauth_access_token, oauth_access_token_secret, results){
                if (error){
                    console.log(error);
                    res.send("yeah something broke.");
                } else {
                    req.session.oauth.access_token = oauth_access_token;
                    req.session.oauth.access_token_secret = oauth_access_token_secret;
                    console.log(results);
                    req.session.authority = 'twitter';
                    req.session.user = {
                        id: results.user_id,
                        name: results.screen_name,
                        isAuthenticated:true
                    };
                    res.redirect('/');
                }
            }
        );
    } else
        next(new Error("you're not supposed to be here."))
};

exports.authenticate = function(req, res){
    oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
        if (error) {
            console.log(error);
            res.send("yeah no. didn't work.")
        }
        else {
            req.session.oauth = {};
            req.session.oauth.token = oauth_token;

            req.session.oauth.token_secret = oauth_token_secret;

            res.redirect('https://twitter.com/oauth/authenticate?oauth_token='+oauth_token)
        }
    });
};