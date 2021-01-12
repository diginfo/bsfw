module.exports = {
  add     : function(id,mod){
    if(!$.mod[id]) $.mod[id] = mod;  
  },

  fn      : require('./func.js'),
  db      : require('./db.js'),
  mail    : require('./mailer'),
  read    : require('./read'),
  send    : require('./send'),
  inbox   : require('./inbox'),
  sqlid   : require('./sqlid'),
  
}