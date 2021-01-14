//cl(global);

module.exports = {

  sstore: $.path.join($.paths.data,'session.json'), 

  // Backup Session Before Restart.
  backup:function(){
    //sesscln();
    var store = JSON.stringify($.sstore.sessions);
    $.fs.writeFileSync(module.exports.sstore,$.lib.fn.jsonString($.sstore));
    ci('@session: saved session file.');
  },
  
  // Restore Old Session After Restart.
  restore:function(cb){
    try {
      if($.lib.fn.fileOlder(module.exports.sstore,60)) throw 'session file is too old.';
      else {
        $.sstore.sessions = require(module.exports.sstore);
        //sesscln();
        ci('[uauth]:restored session file.');
        if(cb) return cb({error:false,msg:'Restored session file.'});
      }
      $.fs.unlinkSync(module.exports.sstore);
    }
    catch(err){
      var msg = `[uauth]:session ${err}`;
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
    var user = $.config.USERS[req._username]; 
    if(user && req._password === user.passwd) {
      req.session.user = req._username;
      req.session.role = user.role;
      req.session.menus = $.config.ROLES[user.role];
      return true
    }
    return false;
  },
  
  login:function(req,res,next){
    if(req.session.user) return next();
    if (!req._username || !req._password) return res.send('login failed');
    if (module.exports.auth(req,res)) res.send("success");
    else res.send('Bad credentials'); 
  },
  
}