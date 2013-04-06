var db = require("./datalayer/db.js")
    , feedreader = require('feedparser')
    , request = require('request');
module.exports = function () {
    var public = {};
    counter = 0;
    function download(feed){

        var latest = new Date(feed.latestPing);
        var articles = [];
        request(feed.url)
            .pipe(new feedreader())
            .on('error', function(error) {
                console.log(error);
            })
            .on('meta', function (meta) {
                //console.log(meta);
            })
            .on('article', function (article) {

                var newDate = new Date(article.date);
                if(latest<newDate)
                {
                    var pl = null,pl=null;
                    if(article.guid && article.guid.isPermaLink && article.guid.isPermaLink === "true"){
                        pl=article.guid;
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

                counter--;

                db.addArticle(feed.idfeeds,articles,function(){
                   if(0 === counter){
                       setTimeout(work,1000);

                   }
                });
            });

    }
    var work = function () {
        db.getFeedsForWorker(function (result) {

            var count= result.length;
            while(count--)
            {
                counter++;
                download(result[count])

            }


        });


    }
    public.Start = function () {
        work();
    }

    return public;
}()