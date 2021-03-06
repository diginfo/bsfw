/*
module.exports.mex = {

  exec: function(src='VMFG',sql){
    mex[src].exec(sql,cl);
  },

  query: function(src='VMFG',sql){
    mex[src].query(sql,true,function(rs){
      cl(JSON.stringify(rs,null,2))
    });
  }
}
*/

const path = require('path');
var app = module.parent.exports;

module.exports = {
  dbs : [
    path.join(__dirname,'./db-sqlms.js'),
    path.join(__dirname,'./db-sqlmy.js'),
    path.join(__dirname,'./db-sqlite.js')
  ],

  load: function(paths){
    paths = paths || module.exports.dbs; 
    paths.map(function(path){
      delete require.cache[require.resolve(path)];
      var mod = require(path)(app);
      //cl(path,module.exports)
      module.exports = Object.assign(module.exports,mod);    
    })
  }
}

module.exports.load(module.exports.dbs);
