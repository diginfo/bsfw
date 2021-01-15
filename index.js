// logs
global.cl = console.log;
global.ce = console.error;
global.ci = console.info;

const mex = module.exports;

const path = require('path');
const express = require('express');
__top = path.dirname(process.mainModule.filename);

const _isbin = (process.mainModule.filename.match(/snapshot/) != null)
if(_isbin) __abs = path.dirname(process.argv[0]);
else __abs = __top;   

global.$ = {
  serving     : false,
  ismod       : (require.main != module),
  isup        : true,
  os          : process.platform,
  isbin       : _isbin,
  
  async       : require('async'),
  path        : path,
  fs          : require('fs'),
  crypto      : require('crypto'),
  util        : require('util'),
  pug         : require('pug'),
  
  timed       : [],
  bhave       : {},
  lib         : {},
  
  paths: {
    
    // ABSOLUTE Path to Root (outside snapshot)
    abs     : __abs,                                // /usr/share/dev/nodejs/src/bsfws
    
    // In pkg these are all relative: to /snapshot 
    top     : __top,                                //  /snapshot/bsfw'*/ 
    config  : path.join(__dirname,'./config.json'), //  /snapshot/bsfw/config.json
    views   : path.join(__dirname,'./views'),       //  /snapshot/bsfw/views
    lib     : path.join(__dirname,'./lib'),         //  /snapshot/bsfw/lib
    data    : path.join(__dirname,'./data'),        //  /snapshot/bsfw/data
    pentaho : [path.join(__top,'./prpt')],          //  [/snapshot/bsfw/prpt]
  },
  
  views     : [path.join(__dirname,'./views')],
  public    : path.join(__dirname,'./public'),
  
};

//cl($.paths); process.exit();

$.config = require($.paths.config);

const bodyParser = require("body-parser");
const session = require('express-session');
$.express = express(); 
$.sstore = new session.MemoryStore()

// Libs
$.lib.fn     = require(path.join($.paths.lib,'./fn.js'));
$.lib.db     = require(path.join($.paths.lib,'./db'));
$.lib.mailer = require(path.join($.paths.lib,'./mailer'));
$.lib.sqlid  = require(path.join($.paths.lib,'./sqlid'));
$.lib.user   = require(path.join($.paths.lib,'./user'));

// Views
$.express.set('views',$.views);
$.express.set('view engine', 'pug');
$.express.set('env', 'development');

// App 3P Middleware
$.express.use(express.static($.public));
// $.express.use(require('cookie-parser')());
$.express.use(require('body-parser').json());
$.express.use(require('body-parser').urlencoded({ extended: false }));

$.express.use(session({
  resave              : true,
  store               : $.sstore,
  secret              : '2C44-4D44-WppQ38S',
  rolling             : true,
  saveUninitialized   : true,
  __cookie: {
    maxAge            : 1000 * 60 * 15
  }
}));

function api(req,res,next){
	cl('api:',req.path,req.query);
	//cl(sstore.sessions)
	//const id = path.basename(req.path);
	const [_,__,func,id] = req.path.split('/');
	
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

// first middlewars.
$.express.use(function(req,res,next){
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
$.express.get('/login',$.lib.user.login);

// dont allow any access unless logged in.
$.express.get('*',function (req, res, next) {
  
  //cl(req.session);
  if(!req.session.user) res.render('index',{
    userauth  : req.session.user
  });
  else next();
})

// Logout endpoint
$.express.get('/logout', function (req, res) {
  mex.render('index',req,function(html){
    req.session.destroy();
    res.send(html);
  });
});

// api data request
$.express.get('/api/*/*',api);
$.express.post('/api/*/*',api);

// page request
$.express.get('/*', (req, res) => {
	var view = path.basename(req.path);
	if(!view || view=='/') view = 'index';
  return mex.render(view,req,function(html){
    res.send(html);  
  });
});


module.exports = {

  lib: $.lib,
  
  onExit: function(options, err) {
    if(!$.isup) return;
    $.isup = false;
    if($.serving) {
      $.lib.user.backup();
      module.exports.stop()
    }
    process.exit();  
  },
  
  // disable caching
  nocache:function(){
    $.express.disable('view cache');
    $.express.set('cache', false);
    $.express.set('etag', false);
    $.express.use((req, res, next) => {
  
      // extend session on activity
      req.session._garbage = Date();
      req.session.touch();
  
      res.set('Cache-Control', 'no-store');
      next();
    })
  },
  
  api:function(arg,cb){
  	arg = arg || {sqlid:null,func:null};
    try {
      var sqlid = arg.sqlid; delete(arg.sqlid);
      var func = arg.func; delete(arg.func);
      cb($.lib.sqlid[sqlid][func](arg,cb));
    } catch(e){
      return cb({error:true,msg:e.message})  
    } 
  },

  // renders a page with pug
  render:function(view,arg,cb){
    arg.session = arg.session || {user:null};
    arg.query = arg.query || {};
  
    var ppath;
    for(var i in $.views.reverse()){
      ppath = $.path.join($.views[i],view);
      if(!(/\.pug$/).test(ppath)) ppath += '.pug';
      if($.fs.existsSync(ppath)) {
        $.pug.renderFile(ppath,{
            basedir   : $.views[0],
          	query     : arg.query,
          	userauth  : arg.session.user,
          	session   : arg.session,
          	config    : $.config
        },function(err,html){
          if(err) return cb({error:true,msg:err.message})
          else cb(html);  
        });       
        break;
      }
    }
  },

  define: {

    config: function(path){
      //delete require.cache[require.resolve($.paths.config)];
      if(path) $.paths.config = path;
      var config = require($.paths.config);
      $.config = $.lib.fn.merge($.config,config);
      
      // reload database defs
      $.lib.db.load();
    },

    define: function(){
      $.lib.db.load();  
    },
    
    lib: function(name,path){
      delete require.cache[require.resolve(path)];
      $.lib[name] = require(path);  
    },
    
    view: function(view){
      if($.views.indexOf(view) < 0) $.views.push(view);
    },
    
    timed: function(fnid){
      if($.timed.indexOf(fnid) < 0) $.timed.push(fnid);
    },    
    
    sqlid: function(lib){
      $.lib.sqlid = Object.assign($.lib.sqlid,lib)
    },
    
  },

  get :{

    bhave:function(key){
      if(key) return $.config.BHAVE[key];
      return $.config.BHAVE;
    },
  
    config:function(key){
      if(key) return $.config[key];
      return $.config;
    }, 

    sqlid: function(id,qry,cb){
      $.lib.sqlid[id].get(qry,cb);  
    },    
    
  },

  put: {
    sqlid: function(id,qry,cb){
      $.lib.sqlid[id].put(qry,cb);  
    },    

    // this might be one table or all !
    config:function(data){
      $.config = $.lib.fn.jsonPut($.paths.config,data);
      $.lib.db.load(); 
      return $.config; 
    },

    bhave: function(table,rows){
      $.config[table] = $.lib.fn.merge($.config[table],rows);  
      return cl($.config[table]);
      $.fn.jsonPut($.paths.config,$.config[table]);
    }
    
  },

  del: {
    sqlid: function(id,qry,cb){
      $.lib.sqlid[id].del(qry,cb);  
    },  
  },
    
  start:function(args){

    try {
      $.server = $.express.listen($.config.APP.port, () => {
        
        var msg = `Server started at port ${$.config.APP.port} with timer ${$.config.APP.timer_mins} mins.`; 
        
        $.lib.user.restore();
        
        // call 5 minute timer
        if($.config.APP.timer_mins > 0) timer(function(day,hms){
          // $.lib.user.sesscln();
          $.timed = [...new Set($.timed)];
          for(var idx in $.timed){
            try{$.timed[idx]()}
            catch(err){ce(`${$.timed[idx]}:${err}`)}
          }
          })
      
      	ci(msg);
      	$.serving = true;
      });
      
      return ({error:false,msg:msg})
    }
    
    catch(e){
      $.serving = false;
      return {error:true,msg:e.message}
    }
  },
  
  stop: function(){
    try {
      $.server.close();
      $.serving = false;
      return ({error:false,msg:'Server stopped.'});
    }
    
    catch(e){
      return ({error:true,msg:e.message})
    }  
  }
}

// Prevent Crashes
process.on('uncaughtException', function (err) {
  ce('\r\n\r\nCRASH - START');
  ce(err);
  ce('CRASH - END\r\n\r\n');
});

// main
process.on('exit', module.exports.onExit.bind(null,{cleanup:false}));
process.on('SIGINT', module.exports.onExit.bind(null, {exit:true}));
process.on('uncaughtException', module.exports.onExit.bind(null, {exit:true}));





