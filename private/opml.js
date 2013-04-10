var opml =  require('opmlparser')
    ,fs = require('fs')
    ,db = require('./datalayer/db.js')
    , async = require('async');

function Opml()
{

}
function parse(iduser,result,cb)
{
        var folders = result.folders;
        var feeds = result.feeds;
    var resultcoll = [];
        async.series([function (callback) {
            db.addFolders(iduser, folders, function (err, result) {
                if (err) {
                       console.log(err);
                } else {
                    folders = result;
                    var count = feeds.length;

                    var outercoll = feeds.slice(0); // create a clone
                    var coll = folders.slice(0);
                    (function _outer(outerdata) {

                        if (outerdata && outerdata.length>0) {

                            var id = outerdata[2];
                            (function _loop(data) {

                                if (data.name === id) {
                                    resultcoll.push([outerdata[0], outerdata[1], data.idcategory]);
                                    coll = folders.slice(0);
                                    setTimeout(_outer.bind(null, outercoll.shift()), 0);
                                }
                                else if (coll.length) {
                                    setTimeout(_loop.bind(null, coll.shift()), 0);
                                }else{
                                    coll = folders.slice(0);
                                    resultcoll.push([outerdata[0], outerdata[1], 0]);
                                    setTimeout(_outer.bind(null, outercoll.shift()), 0);
                                }
                            }(coll.shift()));
                        }else{
                            console.log('loop ready. result ', resultcoll.length);
                            callback();
                        }
                    }(outercoll.shift()));

                }


            });
        },
            function (callback) {
                db.mergeFeeds(iduser,resultcoll,function(){
                    callback();
                })

            }], function () {
                   cb(resultcoll);
        });

}
Opml.prototype.readopml = function(iduser,_path,callback)
{
    var feeds = [];
    var folders = [];
    fs.createReadStream(_path)
        .pipe(new opml())
        .on('error', function(error) {
            callback(error);
        })
        .on('feed', function (feed) {
            var _feed= [
                feed.xmlurl,
                feed.text,
                feed.folder
            ];
            feeds.push(_feed);
            if(folders.indexOf(feed.folder) < 0)
            {
                folders.push(feed.folder);

            }

        })
        .on('end', function () {
            console.log('parsing');
            parse(iduser,{folders:folders,feeds:feeds},callback);
        });
}
exports = module.exports = Opml;