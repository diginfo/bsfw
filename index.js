// logs
global.cl = console.log;
global.ce = console.error;
global.ci = console.info;

const path = require('path');
const express = require('express');

global.__abs = path.join(__dirname,'../');
if (__abs.match(/snapshot/)) {
  __abs = path.dirname(process.argv[0]);
  var isbin = true;
} else {
  isbin = false;
}

global.$ = {
  isbin       : isbin,
  
  async       : require('async'),
  path        : path,
  fs          : require('fs'),
  crypto      : require('crypto'),
  util        : require('util'),
  pug         : require('pug'),
  
  timed       : [],
  
  lib         : {},
  
  paths: {
    abs     : __abs,
    config  : path.join(__dirname,'config.json'),
    views   : path.join(__dirname,'views'),
    lib     : path.join(__dirname,'lib'),
  },
  
  views     : [path.join(__dirname,'views')],
  public    : path.join(__dirname,'public'),
  
};

$.config = require($.paths.config);

const bodyParser = require("body-parser");
const session = require('express-session');
$.app = express(); 
$.sstore = new session.MemoryStore()

// Libs
$.lib.fn     = require(path.join($.paths.lib,'fn.js'));
$.lib.db     = require(path.join($.paths.lib,'db'));
$.lib.mailer = require(path.join($.paths.lib,'mailer'));
$.lib.sqlid  = require(path.join($.paths.lib,'sqlid'));

$.lib.user   = require(path.join($.paths.lib,'user'));

// Views
$.app.set('views',$.views);
$.app.set('view engine', 'pug');
$.app.set('env', 'development');

// App 3P Middleware
$.app.use(express.static($.public));
// $.app.use(require('cookie-parser')());
$.app.use(require('body-parser').json());
$.app.use(require('body-parser').urlencoded({ extended: false }));

$.app.use(session({
  resave              : true,
  store               : $.sstore,
  secret              : '2C44-4D44-WppQ38S',
  rolling             : true,
  saveUninitialized   : true,
  __cookie: {
    maxAge            : 1000 * 60 * 15
  }
}));

// disable caching
function nocache(){
  $.app.disable('view cache');
  $.app.set('cache', false);
  $.app.set('etag', false);
  $.app.use((req, res, next) => {

    // extend session on activity
    req.session._garbage = Date();
    req.session.touch();

    res.set('Cache-Control', 'no-store');
    next();
  })
}

// Prevent Crashes
process.on('uncaughtException', function (err) {
  ce('\r\n\r\nCRASH - START');
  ce(err);
  ce('CRASH - END\r\n\r\n');
});

function api(req,res,next){
	cl('api:',req.path,req.query);
	//cl(sstore.sessions)
	//const id = path.basename(req.path);
	const [_,__,func,id] = req.path.split('/');
	if(!(id in $.lib.sqlid) || !(func in $.lib.sqlid[id]) ) return res.send({error:true,msg:`Invalid Endpoint <${id}>`})
	
  // object
  return $.lib.sqlid[id][func](req.query,function(data){
    res.json(data);	
	});
}

/// 5 minuter timer
function timer(cb,delay){
  delay = delay || 0;
  var mins = $.config.APP.timer_mins || 0;
  setInterval(function() {
    var date = new Date();
    var sec = date.getSeconds();
    var min = date.getMinutes();
    if ( sec === 0 && min % mins == 0) {
  	  setTimeout(function(){
    	  cb(delay)  
  	  },delay);
    }
  },1000);
}

// disable caching for deleopment
nocache();


// first middlewars.
$.app.use(function(req,res,next){
  if(req.method=='POST') req.query = Object.assign(req.query,req.body);
  if(req.session.user) return next();
  
  // remove user info from req.query.
  req._username = req._username || req.query.username;
  req._password = req._password || req.query.password;
  delete(req.query.username);
  delete(req.query.password);
  
  // remove
  /*
  if(req.query._debug){
    req._debug = req.query._debug;
    delete(req.query._debug); 
  }
  */
  
  if (req.headers.authorization) {
    [req._username,req._password] = new Buffer(req.headers.authorization.split(" ")[1], 'base64').toString().split(':');
    if ($.lib.user.auth(req,res)) return next()
  }
  next()
})

// Login endpoint
$.app.get('/login',$.lib.user.login);

// dont allow any access unless logged in.
$.app.get('*',function (req, res, next) {
  
  //cl(req.session);
  if(!req.session.user) res.render('index',{
    userauth  : req.session.user
  });
  else next();
})

// Logout endpoint
$.app.get('/logout', function (req, res) {
  req.session.destroy();
  res.render("index");
});

// api data request
$.app.get('/api/*/*',api);
$.app.post('/api/*/*',api);

// page request
$.app.get('/*', (req, res) => {
  // cl(req.path)
	//if(req.path=='/favicon.ico') return res.end();
	var view = path.basename(req.path);
	if(!view || view=='/') view = 'index';
	// cl(req.session.menus,view);
	// || !req.session.menus[view]

	res.render(view,{
  	query     : req.query,
  	userauth  : req.session.user,
  	session   : req.session,
  	config    : $.config
  },function(err,html){
    //if(err) res.redirect('/');
    if(err) {
      res.end();
      cl(err);
    }
    else res.send(html);  
  });
});

module.exports.views = function(view){
  if($.views.indexOf(view) < 0) $.views.push(view);  
}

module.exports.timed = function(fnid){
  if($.timed.indexOf(fnid) < 0) $.timed.push(fnid);
}

module.exports.sqlid = function(lib){
  $.lib.sqlid = Object.assign($.lib.sqlid,lib)
}

module.exports.config = function(path){
  //delete require.cache[require.resolve($.paths.config)];
  if(path) $.paths.config = path;
  $.config = Object.assign($.config,require($.paths.config));

  // reload database defs
  $.lib.db.load();  
}

module.exports.start = function(){
  $.app.listen($.config.APP.port, () => {
    
    // call 5 minute timer
    if($.config.APP.timer_mins > 0) timer(function(day,hms){
      // user.sesscln();
      $.timed = [...new Set($.timed)];
      for(var idx in $.timed){
        try{$.timed[idx]()}
        catch(err){ce(`${$.timed[idx]}:${err}`)}
      }
      })
  
  	cl(`Server started at port ${$.config.APP.port} with timer ${$.config.APP.timer_mins} mins.`);
  });
}

