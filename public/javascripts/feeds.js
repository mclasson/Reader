define(
    [],
    function () {
        return function Feeds() {
            var self=this;
            self.feedArray = ko.observableArray([]);

            self.loadFeeds = function(feeds){
                for(var i=0;i<feeds.length;i++){
                    self.feedArray().push(feeds[i]);
                }
            }

        };

    }
);