var db = require("./datalayer/db.js")
    , feedreader = require('feedparser')
    , request = require('request')
    , Opml = require('./opml.js')
    , async = require('async')
    , Util = require('./Utils.js');

module.exports = function () {
    var public = {};
    counter = 0;
    var check = function(){
        counter--;
        if (0 === counter) {
            counter = -1;
            setTimeout(work, 1000);

        }

    };

    function download(feed) {

        var latest = new Date(feed.latestPing);
        var articles = [];

        request({timeout: 60000, uri: feed.url})
            .on('error', function (error) {
                console.log('error in request', feed.name, error, feed);
                db.resetPing(feed.idfeeds, function () {
                    counter--;
                    if (0 === counter) {
                        --counter;
                        setTimeout(work, 1000);
                    }
                });
            })
            .pipe(new feedreader())
            .on('error', function (error) {

                if(error.message === 'Not a feed' || error.errno === 'ETIMEDOUT') {
                    console.log('not a feed');
                    db.killFeed(feed.idfeeds,check);
                }else{
                    console.log('error in feedreader', feed.name, error, feed);
                    db.resetPing(feed.idfeeds,check);
                }

            })
            .on('meta', function (meta) {
                //console.log(meta);
            })
            .on('article', function (article) {

                var newDate = new Date(article.date);
                if (latest < newDate) {
                    var pl = null, pl = null;
                    if (article.guid && article.guid.isPermaLink && article.guid.isPermaLink === "true") {
                        pl = article.guid;
                    }
                    var a = [
                        article.title,
                        pl,
                        feed.idfeeds,
                        article.link
                    ];
                    articles.push(a);

                }
            })
            .on('end', function () {
                if (articles.length > 0) {
                    db.addArticle(feed.idfeeds, articles, check);
                } else {
                    db.resetPing(feed.idfeeds, check);
                }
            });

    }

    var work = function () {
        db.getFeedsForWorker(function (result) {

            var count = result.length;
            if (count > 0) {
                counter = result.length;
                while (count--) {

                    download(result[count])

                }
            } else {
                console.log('no feeds');
                counter = 0;
                setTimeout(work, 1000);
            }

        });


    }
    public.Start = function () {
        work();
    }

    return public;
}()