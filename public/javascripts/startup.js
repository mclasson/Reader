var ko;
$(function(){
    $.ajax({
        url: "/api/feeds"
    }).done(function ( data ) {
        require(["/javascripts/feeds.js","/javascripts/knockout-2.2.1.js"],function(Feed,knockout){
            //ko = ko  || knockout;
            var feeds = new Feed(knockout);
            feeds.loadFeeds(data.feeds);
            knockout.applyBindings(feeds);
        });
        });

    $('UL.nav').delegate('a#opmlLink','click', function(){
        require(["/javascripts/bootstrap-fileupload.min.js"],function(fup){
            $("#opml").modal();
        });
    });

$('.modal-footer').delegate('#upload','click',function(){
    console.log('upload');
    var formdata = new FormData();

    var file = document.getElementById("uploadfilename") ;

    if (formdata) {
        formdata.append("file1", file).files[0];
    }
    /*
    $.ajax({
        url: '/api/opml',  //server script to process data
        type: 'POST',
        success: function(data){
            console.log(data);
        },
        error: function(err){
            console.log(err);
        },
        data: formdata,
        cache: false,
        contentType: false,
        processData: false
    });
      */
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/opml");
    xhr.send(formdata);
    return false;

});

});