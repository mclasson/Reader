define(
    [],
    function () {
        return function Feeds(ko) {
            var self=this;
            self.feedArray = ko.observableArray([]);

            self.loadFeeds = function(feeds){
                for(var i=0;i<feeds.length;i++){
                    self.feedArray().push(feeds[i]);
                    console.log(feeds[i]);
                }
            }

        };

    }
);