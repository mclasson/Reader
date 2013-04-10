var utils = function Utils(){

};

utils.prototype.findById = function(collection, _id, cb){
    var coll = collection.slice( 0 ); // create a clone

    (function _loop( data ) {
        if( data._id === _id ) {
            cb.apply( null, [ data ] );
        }
        else if( coll.length ) {
            setTimeout( _loop.bind( null, coll.shift() ), 25 );
        }
    }( coll.shift() ));
};
exports = module.exports = utils;