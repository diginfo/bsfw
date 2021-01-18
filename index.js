// logs
global.cl = console.log;
global.ce = console.error;
global.ci = console.info;

const mex = module.exports;

mex.mod = {
  async       : require('async'),
  path        : require('path'),
  fs          : require('fs'),
  crypto      : require('crypto'),
  util        : require('util'),
  pug         : require('pug'),
}

const express = require('express');
__top = mex.mod.path.dirname(process.mainModule.filename);

const _isbin = (process.mainModule.filename.match(/snapshot/) != null)
if(_isbin) __abs = mex.mod.path.dirname(process.argv[0]);
else __abs = __top;   

mex.debug = false;

mex.flag = {
  serving     : false,
  ismod       : (require.main != module),
  stopping    : false,
  os          : process.platform,
  isbin       : _isbin
}

mex.path = {
    
  // ABSOLUTE Path to Root (outside snapshot)
  abs     : __abs,                                // /usr/share/dev/nodejs/src/bsfws
  
  // In pkg these are all relative: to /snapshot 
  config  : mex.mod.path.join(__dirname,'./config.json'), //  /snapshot/bsfw/config.json
  lib     : mex.mod.path.join(__dirname,'./lib'),         //  /snapshot/bsfw/lib
  data    : mex.mod.path.join(__dirname,'./data'),        //  /snapshot/bsfw/data
  prpt    : [mex.mod.path.join(__abs,'./prpt')],          //  [/snapshot/bsfw/prpt]

  views   : [mex.mod.path.join(__dirname,'./views')],
  public  : [mex.mod.path.join(__dirname,'./public')],

};

// load the config first.
mex.config = require(mex.path.config);


mex.bhave = mex.config.BHAVE || {};
mex.timed = [];

// Custom Module Libs
function libinit(){
  mex.lib = {};
  mex.lib.fn     = require(mex.mod.path.join(mex.path.lib,'./fn.js'));
  mex.lib.db     = require(mex.mod.path.join(mex.path.lib,'./db'));
  mex.lib.mailer = require(mex.mod.path.join(mex.path.lib,'./mailer'));
  mex.lib.sqlid  = require(mex.mod.path.join(mex.path.lib,'./sqlid'));
  mex.lib.user   = require(mex.mod.path.join(mex.path.lib,'./user'));
  mex.lib.pho    = require(mex.mod.path.join(mex.path.lib,'./pentaho'));  
}

// initialise express.
function expinit(){
  
  const bodyParser = require("body-parser");
  const session = require('express-session');
  mex.express = express();
  mex.sstore = new session.MemoryStore() 
  
  // Views
  mex.express.set('views',mex.path.views);
  mex.express.set('view engine', 'pug');
  mex.express.set('env', 'development');
  
  // App 3P Middleware
  mex.path.public.map(function(pub){
    mex.express.use(express.static(pub));    
  })

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
  	var view = mex.mod.path.basename(req.path);
  	if(!view || view=='/') view = 'index';
    return module.exports.render(view,req,function(html){
      res.send(html);  
    });
  });

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

  // renders a page with pug
  render:function(view,arg,cb){
    arg.session = arg.session || {user:null};
    arg.query = arg.query || {};
  
    var ppath;
    for(var i in mex.path.views.reverse()){
      ppath = mex.mod.path.join(mex.path.views[i],view);
      if(!(/\.pug$/).test(ppath)) ppath += '.pug';
      if(mex.mod.fs.existsSync(ppath)) {
        mex.mod.pug.renderFile(ppath,{
            basedir   : mex.path.views[0],
          	query     : arg.query,
          	userauth  : arg.session.user,
          	session   : arg.session,
          	config    : mex.config,
          	app       : mex
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
      //delete require.cache[require.resolve(mex.path.config)];
      if(path) mex.path.config = path;
      var config = require(mex.path.config);
      mex.config = mex.lib.fn.merge(mex.config,config);
      
      // reload database defs
      mex.lib.db.load();
    },

    db: function(){
      mex.lib.db.load();  
    },
    
    lib: function(name,path){
      delete require.cache[require.resolve(path)];
      mex.lib[name] = require(path);  
    },
    
    view: function(view){
      if(mex.path.views.indexOf(view) < 0) mex.path.views.push(view);
    },
    
    timed: function(fnid){
      if(mex.timed.indexOf(fnid) < 0) mex.timed.push(fnid);
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
        if(mex.config.APP.timer_mins > 0) timer(function(day,hms){
          // mex.lib.user.sesscln();
          mex.timed = [...new Set(mex.timed)];
          for(var idx in mex.timed){
            try{mex.timed[idx]()}
            catch(err){ce(`${mex.timed[idx]}:${err}`)}
          }
          })
      
      	ci(msg);
      	ci(mex.path);
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




