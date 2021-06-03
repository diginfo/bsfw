// logs
global.cl = console.log;
global.ce = console.error;
global.ci = console.info;

const mex = module.exports;
const path = require('path'); 

// External Modules
mex.mod = {
  async       : require('async'),
  path        : path,
  fs          : require('fs'),
  crypto      : require('crypto'),
  util        : require('util'),
  pug         : require('pug'),
}

// Internal Libs
mex._libs = {
  fn      : 'fn',
  db      : 'db',
  mailer  : 'mailer',
  sqlid   : 'sqlid',
  user    : 'user',
  pho     : 'pentaho'
}

const express = require('express');
__app = path.dirname(process.mainModule.filename);
__bsfw = __dirname;

const _isbin = (process.mainModule.filename.match(/snapshot/) != null)
if(_isbin) __abs = path.dirname(process.argv[0]);
else __abs = __app;   

mex.debug = false;

mex.flag = {
  serving     : false,
  ismod       : (require.main != module),
  stopping    : false,
  os          : process.platform,
  isbin       : _isbin,
  debug       : false,
}

mex.path = {

    // ABSOLUTES - Path to Root (editable and outside /snapshot)
  abs       : __abs,                                        // /usr/share/dev/nodejs/src/bsfws
  prpt      : [path.join(__abs,'./prpt')],                  //  [/snapshot/bsfw/prpt]
  
  // REALATIVES - Relative to Internal Snapshot
  app       : __app,                                        // the app root folder (/snapshot/node)
  bsfw      : __bsfw,                                       // the bsfw module folder
  
  config  : path.join(__bsfw,'./config.json'),              //  /snapshot/bsfw/config.json
  lib     : path.join(__bsfw,'./lib'),                      //  /snapshot/bsfw/lib - C:\\snapshot\\node\\node_modules\\bsfw\\lib 
  data    : path.join(__bsfw,'./data'),                     //  /snapshot/bsfw/data
  
  views   : [   /* first come - first served */
    path.join(__app,'./views'),
    path.join(__bsfw,'./views'),
  ],
  
  public  : [   /* first come - first served */
    path.join(__app,'./public'),
    path.join(__bsfw,'./public'),
  ],
  
};

// load the config first.
mex.config = require(mex.path.config);

// Debugging.
mex.flag.debug = mex.config.APP.debug || false;
if(!mex.flag.debug) global.cl = function(){};

mex.bhave = mex.config.BHAVE || {};
mex.timed = [];

// Internal Lib Load / Reload
function libinit(reload=false){
  
  mex.lib = {};
  for(var key in mex._libs){
    var mod = mex._libs[key];
    var _path = path.join(mex.path.lib,`${mod}.js`);
    if(reload) delete require.cache[require.resolve(_path)];
    mex.lib[key] = require(_path);
  }

}

// initialise express.
function expinit(){
  
  const bodyParser = require("body-parser");
  const session = require('express-session');
  mex.express = express();
  mex.sstore = new session.MemoryStore() 
  
  // Define Views
  mex.express.set('views',mex.path.views);
  mex.express.set('view engine', 'pug');
  mex.express.set('env', 'development');
  
  // Define public static folders (first come - first served)
  mex.path.public.map(function(pub){
    mex.express.use(express.static(pub));    
  });

  // mex.express.use(require('cookie-parser')());
  mex.express.use(require('body-parser').json());
  mex.express.use(require('body-parser').urlencoded({ extended: false }));
  
  mex.express.use(session({
    resave              : true,
    store               : mex.sstore,
    secret              : '2C44-4D44-WppQ38S',
    rolling             : true,
    saveUninitialized   : true,
    __cookie: {
      maxAge            : 1000 * 60 * 15
    }
  }));

  // first middleware.
  mex.express.use(function(req,res,next){
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
      if (mex.lib.user.auth(req,res)) return next()
    }
    next()
  })

  // Pentaho endpoint.
  mex.express.get('/pho/*',mex.lib.pho.get);
  
  // Login endpoint
  mex.express.get('/login',mex.lib.user.login);
  
  // dont allow any access unless logged in.
  mex.express.get('*',function (req, res, next) {
    
    //cl(req.session);
    if(!req.session.user) res.render('index',{
      userauth  : req.session.user
    });
    else next();
  })
  
  // Logout endpoint
  mex.express.get('/logout', function (req, res) {
    module.exports.render('index',req,function(html){
      if(html.error) cl(html);
      req.session.destroy();
      res.send(html);
    });
  });
  
  // api data request
  mex.express.get('/api/*/*',api);
  mex.express.post('/api/*/*',api);

  // page request
  mex.express.get('/*', (req, res) => {
  	if(mex.config.APP.disable_login) return res.json({error:true,msg:'Logins disabled.'});
  	var view = path.basename(req.path);
  	if(!view || view=='/') view = 'index';
    return module.exports.render(view,req,function(html){
      if(html.error) cl(html);
      res.send(html);  
    });
  });

}

function error(err){
  res.send(`<html><h1></h1></html>`)
}


function api(req,res,next){
	cl('api:',req.path,req.query);
	//cl(sstore.sessions)
	//const id = path.basename(req.path);
	const [_,__,func,id] = req.path.split('/');
	
  return mex.lib.sqlid[id][func](req.query,function(data){
    res.json(data);	
	});
}

/// 5 minuter timer
function timer(cb,delay){
  delay = delay || 0;
  var mins = mex.config.APP.timer_mins || 0;
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

module.exports = Object.assign(module.exports,{

  resolve: function(_path){
    // test for app.path using $data/xxx/yyy/file.txt
    var apath = _path.match(/^\$([^\/]+)/);
    if(apath && mex.path[apath[1]]) return _path.replace(apath[0],mex.path[apath[1]])
    return _path
  },
  
  onExit: function(options, err) {
    if(mex.flag.stopping) return;
    mex.flag.stopping = true;
    
    var tout = setTimeout(function(){
      process.exit();  
    })
    
    // force-stop after 5 seconds.
    module.exports.stop(function(){
      clearTimeout(tout);
      process.exit();
    },5000); 
  },
  
  // disable caching
  nocache:function(){
    mex.express.disable('view cache');
    mex.express.set('cache', false);
    mex.express.set('etag', false);
    mex.express.use((req, res, next) => {
  
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
      cb(mex.lib.sqlid[sqlid][func](arg,cb));
    } catch(e){
      return cb({error:true,msg:e.message})  
    } 
  },

  // renders a page with pug (first found - first served)
  render: function(view,req,cb){

    req.session = req.session || {user:null};
    req.query = req.query || {};

    const opts = {
    	query     : req.query,
    	userauth  : req.session.user,
    	session   : req.session,
    	config    : mex.config,
    	app       : mex
    }
    
    mex.express.render(view,opts,function(err,html){
      if(err) return cb({error:true,msg:`pug.renderFile(${err.message})`})
      else return cb(html);
    });

  },

  define: {

    config: function(_path){
      if(_path) mex.path.config = _path;
      var config = require(mex.path.config);
      mex.config = mex.lib.fn.merge(mex.config,config);
      
      // re-load all standard modules.
      libinit(true);

    },

    db: function(){
      mex.lib.db.load();  
    },
    
    lib: function(name,_path){
      delete require.cache[require.resolve(_path)];
      mex.lib[name] = require(_path);  
    },
    
    view: function(view){
      if(mex.path.views.indexOf(view) < 0) mex.path.views.unshift(view);
    },
    
    timed: function(fnids){
      if(!Array.isArray(fnids)) fnids = [fnids];
      fnids.map(function(fnid){
        if(mex.timed.indexOf(fnid) < 0) mex.timed.push(fnid);  
      });
    },    
    
    // append a sqlid to the lib/sqlid.js object
    sqlid: function(lib){
      try {
        if(typeof(lib)=='string') lib = require(lib);
        mex.lib.sqlid = Object.assign(mex.lib.sqlid,lib);
      } catch(e){ce(e.message)}
    },
    
  },

  get :{

    menus: function(){
      var menus = mex.config.MENUS;
      for(var men in menus){
        menus[men].id = men;
        menus[men].children = menus[men].children || {};
        for(var child in menus[men].children){
          menus[men].children[child].id = child;    
        }
      }
      return menus;
    },

    bhave:function(key){
      if(key) return mex.config.BHAVE[key];
      return mex.config.BHAVE;
    },
  
    config: function(key){
      if(key) return mex.config[key];
      return mex.config;
    }, 

    sqlid: function(id,qry,cb){
      mex.lib.sqlid[id].get(qry,cb);  
    },    
    
  },

  put: {
    
    sqlid: function(id,qry,cb){
      mex.lib.sqlid[id].put(qry,cb);  
    },    

    // this might be one table or all !
    config:function(data){
      mex.config = mex.lib.fn.jsonPut(mex.path.config,data);
      mex.lib.db.load(); // always reload the databases. 
      return mex.config; 
    },

    bhave: function(table,rows){
      mex.config[table] = mex.lib.fn.merge(mex.config[table],rows);  
      return cl(mex.config[table]);
      mex.fn.jsonPut(mex.path.config,mex.config[table]);
    }
    
  },

  del: {
    sqlid: function(id,qry,cb){
      mex.lib.sqlid[id].del(qry,cb);  
    },  
  },
    
  start:function(args){

    try {
      mex.server = mex.express.listen(mex.config.APP.port, () => {
        var msg = `Server started at port ${mex.config.APP.port} with timer ${mex.config.APP.timer_mins} mins.`; 
        
        // restore session
        mex.lib.user.restore();
        
        // call 5 minute timer
        if(mex.config.APP.timer_mins > 0) timer(function(){
           mex.timed = [...new Set(mex.timed)];
           var idx = -1;
           mex.mod.async.eachSeries(mex.timed,function(_func,next) {
            idx++;
            try{mex.timed[idx]()}
            catch(err){ce(`Timer: ${mex.timed[idx]}:${err}`)}
            finally{next()}
          },function(){
            cl(`Timer processd ${mex.timed.length} events.`)
          });
          
        });
      
      	ci(msg);
      	ci('PATHS:',JSON.stringify(mex.path,null,2));
      	mex.flag.serving = true;
      });
      
      return ({error:false,msg:msg})
    }
    
    catch(e){
      mex.flag.serving = false;
      return {error:true,msg:e.message}
    }
  },
  
  stop: function(cb){
    try {
      mex.server.close(function(cb){
        ci('Stopping Server...');
        mex.lib.user.backup();
        process.exit();
      });
    }
    
    catch(e){
      return ({error:true,msg:e.message})
    }  
  }
})

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

libinit();
expinit();

/*
function test(){
  console.log('@ timer-push test');
}
mex.timed.push(test);
cl(mex.timed);
*/

