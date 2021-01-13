//cl(global);

module.exports = {

  saveSession: function(){
    
    
  },
  
  restoreSession: function(){
    
    
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