var http = require('http');
var AUTH_TOKEN = "14f9ad049e4b036b56047a529";
var ACCOUNT_ID = "665003303001";
var ACCOUNT_LIMIT_IN_GB = 40;
var MEDIA_API_TOKEN = "7kITGpNoLcepAAN-8u7b--bguf8F_S5pxbVFh7l8ihCoiMkqltT0JA..";
var TIMES = [720, 1440, 10080];

var cached = { 
  "720cache": 0
, "1440cache": 0
, "10080cache": 0
};

//Keep refreshing this data
setInterval( makeMetricCalls, 180000);

function makeMetricCalls() {
  for( var i=0; i<TIMES.length; i++) {
     fetchMetrics( TIMES[i]);
   }
}

var makeAPICall = function(path, callback){
  console.log( path );
  var apiResponse = ''
  , options = {
    host: 'data.brightcove.com'
    , port: 80
    , path: path
    , headers: {'Authorization': 'Bearer ' + AUTH_TOKEN}
  };

  http.get(options, function(res){
    res.on('data', function(data){
      apiResponse += data;
    }).on('end', function(){
      callback(apiResponse);
    });
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });

  return apiResponse;
};

var makeMediaAPICall = function(path, callback) {
  var apiResponse = ''
  , options = {
    host: 'api.brightcove.com'
    , port: 80
    , path: path
  };

  http.get(options, function(res){
    res.on('data', function(data){
      apiResponse += data;
    }).on('end', function(){
      callback(apiResponse);
    });
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });

  return apiResponse;
}

function getVideoIDs( data ) {
  var videos = [];
  for( var i=0, len=data.length; i<len; i++ ) {
    videos.push( data[i].video );
  }
  return videos;
}

function makeArray( data ) {
  var ret = [];
  for( var x in data ) {
    ret.push( data[x] );
  }
  return ret;
}

function mergeData( vc, ac ) {
  var videos = [];

  for( var i=0, len=ac.length; i<len; i++ ) {
    for( var j=0, max=vc.length; j<max; j++ ) {
      if( ac[i].video == vc[j].id ) {
        
        videos.push( 
          {
            id: vc[j].id,
            title: vc[j].name,
            description: vc[j].shortDescription,
            still: vc[j].videoStillURL,
            views: makeArray( ac[i].data.video_view ),
            impressions: makeArray( ac[i].data.video_impression )
          }
        );
      }
    } 
  }
  return videos;
}

function formatData( vc, ac, al, to, from ) {
  var ret = {}
  
  ret.start = from;
  ret.end = to;
  ret.views = makeArray( al.data.video_view );
  ret.impression = makeArray( al.data.video_impression );
  ret.videos =  mergeData( vc, ac );
  
 return ret;
}

function fetchMetrics( from ) {
  console.log( "calling fetch metrics for: " + from ); 
  var cacheKey = from + "cache";
  var to = new Date().getTime();
  var from = to - (from * 1000 * 60);
  var videoMetrics;
  var metaData;
  var accountMetrics;
  
  makeAPICall( '/analytics-api/data/videocloud/account/' + ACCOUNT_ID + "?from=" + from + "&to=" + to, function( data ) {
    accountMetrics = JSON.parse( data );
    if( metaData ) {
      cached[cacheKey] = formatData( metaData, videoMetrics, accountMetrics, to, from );
    }
  });
  
  makeAPICall("/analytics-api/data/videocloud/account/" + ACCOUNT_ID + "/video/?sort=summary.video_view&from=" + from + "&to=" + to + "&limit=10", function( aData ) {
    var videoIDs;
    videoMetrics = JSON.parse( aData );
    videoIDs = getVideoIDs( videoMetrics ).join( "%2C" );
    
    //Make request for top ten videos
    makeMediaAPICall( "/services/library?command=find_videos_by_ids&token=" + MEDIA_API_TOKEN + "&video_ids=" + videoIDs + "&video_fields=id%2Cname%2CvideoStillURL%2CshortDescription&get_item_count=true", function(data) {
      metaData = JSON.parse( data ).items;
      if( accountMetrics ) {
        if( metaData ) {
          cached[cacheKey] = formatData( metaData, videoMetrics, accountMetrics, to, from );
        }
      }
    });
  });
  
}

exports.index = function(req, res){
  res.render('index', { title: 'Express' })
};

exports.metrics = function(req, res){
  //to - (req.params.from * 1000 * 60);
  var from = req.params.from;
  var cacheKey = from + "cache";
  res.send( cached[cacheKey] );
};

makeMetricCalls();

exports.usage = function(req, res){
  var to = new Date().getTime();
  var from = to - (43200 * 1000 * 60);
  makeAPICall('/analytics-api/data/videocloud/account/' + ACCOUNT_ID + "?from=" + from + "&to=" + to, function( data ) {
    res.send( data );
    return;
    var bytes = JSON.parse(data).data.bytes_out;
    var total = 0;
    for( var i in bytes ) {
      console.log( bytes[i]);
      total += bytes[i] / 1024 / 1024;
    }
    total = total / 1024;
    console.log( total );
    res.send(JSON.parse(data).data.bytes_out);
  });
}