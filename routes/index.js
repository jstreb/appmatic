var http = require('http');
var AUTH_TOKEN = "14f9ad049e4b036b56047a529";
var ACCOUNT_ID = "665003303001";
var ACCOUNT_LIMIT_IN_GB = 40;

var makeAPICall = function(path, callback){
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

exports.index = function(req, res){
  res.render('index', { title: 'Express' })
};

exports.metrics = function(req, res){
  var to = new Date().getTime();
  var from = to - (req.params.from * 1000 * 60);
  console.log( "hmm" );
  makeAPICall("/analytics-api/data/videocloud/account/" + ACCOUNT_ID + "/video/1673309193001?from=" + from + "&to=" + to, function( data ) {
    res.send(data.account);
  });
  
};

exports.usage = function(req, res){
  var to = new Date().getTime();
  var from = to - (43200 * 1000 * 60);
  makeAPICall('/analytics-api/data/videocloud/account/' + ACCOUNT_ID + "?from=" + from + "&to=" + to, function( data ) {
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