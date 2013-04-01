var ko;
$(function(){
    $.ajax({
        url: "/api/feeds"
    }).done(function ( data ) {
        require(["/javascripts/feeds.js","/javascripts/knockout-2.2.1.js"],function(Feed,knockout){
            ko = ko  || knockout;
            var feeds = new Feed();
            feeds.loadFeeds(data.feeds);
            ko.applyBindings(feeds);
        });
        });
});