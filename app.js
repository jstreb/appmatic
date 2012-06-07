
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.get('/metrics/:from', routes.metrics);
app.get('/usage', routes.usage);
// app.get('/api/v1/:format/account/:publisherId([0-9]+)/token::token', middleware.requiresToken, routes.account); //account
// app.get('/api/v1/:format/account/:publisherId([0-9]+)/player/:playerId([0-9]+)/token::token', routes.player); //player
// app.get('/api/v1/:format/account/:publisherId([0-9]+)/video/:videoId([0-9]+)/token::token', routes.video); //video
// app.get('/api/v1/:format/account/:publisherId([0-9]+)/video/:videoId([0-9]+)/player/:playerId([0-9]+)/token::token', routes.player); //video in a player
// app.get('/api/v1/:format/account/:publisherId([0-9]+)/video/:videoId([0-9]+)/to::toTime([0-9]+)/token::token', routes.video); //video with no from time
// app.get('/api/v1/:format/account/:publisherId([0-9]+)/video/:videoId([0-9]+)/from::fromTime([0-9]+)/token::token', routes.video); //video with no to time
// app.get('/api/v1/:format/account/:publisherId([0-9]+)/video/:videoId([0-9]+)/from::fromTime([0-9]+)/to::toTime([0-9]+)/token::token', routes.video); //video with both from and to


app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
