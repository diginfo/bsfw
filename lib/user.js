const path = require('path');
const app = module.parent.exports;
module.exports = {

  maxage  : 60, /* max age for session restore */
  sstore  : path.join(app.path.data,'session.json'), 

  // Backup Session Before Restart.
  backup:function(){
    //sesscln();
    app.mod.fs.writeFileSync(module.exports.sstore,app.lib.fn.jsonString(app.sstore.sessions));
    ci('@user.js: saved session file.');
  },
  
  // Restore Old Session After Restart.
  restore:function(cb){
    try {
      if(app.lib.fn.fileOlder(module.exports.sstore,module.exports.maxage)) throw 'session file is too old.';
      else {
        app.sstore.sessions = require(module.exports.sstore);
        //sesscln();
        ci('@user.js:restored session file.');
        if(cb) return cb({error:false,msg:'Restored session file.'});
      }
      app.mod.fs.unlinkSync(module.exports.sstore);
    }
    catch(err){
      var msg = `@user.js:session ${err}`;
      ce(msg);
      if(cb) cb({error:true,msg:msg})
    };  
  },

  // cleanup session store
  sesscln: function(){
    var dupes = {};
    var ss = sstore.sessions;
    for(var sid in ss){ 
      var ses = JSON.parse(ss[sid]);
      var uid = ses.userid;
      
      // Save duplicate UID Sessions
      if(ses.userid){
        if(!dupes[uid]) dupes[ses.userid] = [sid];
        else dupes[uid].push(sid);
      }
      
      var expires = new Date(ses.cookie.expires); 
      if(!uid || (expires && expires < now())) {
        delete sstore.sessions[sid];
      }
    }
    
    // Delete all but last session
    for(var uid in dupes){
      dupes[uid].pop();
      dupes[uid].map(function(sid){
        ce(`[uauth] duplicates: ${uid}:${sid}`);
        delete sstore.sessions[sid];    
      }) 
    }
  },
  
  auth:function(req,res){
    var user = app.config.USERS[req._username]; 
    if(user && req._password === user.passwd) {
      req.session.user = req._username;
      req.session.role = user.role;
      req.session.menus = app.config.ROLES[user.role];
      return true
    }
    return false;
  },
  
  login:function(req,res,next){
    if(app.config.APP.disable_login) return res.json({error:true,msg:'Logins disabled.'});
    if(req.session.user) return next();
    if (!req._username || !req._password) return res.send('login failed');
    if (module.exports.auth(req,res)) res.send("success");
    else res.send('Bad credentials'); 
  },
  
}