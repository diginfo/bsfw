module.exports = function(app){

  const promisify   = app.mod.util.promisify;
  const path        = app.mod.path;
  const async       = app.mod.async;
  const sqlite3     = require('sqlite3');
  
  const mex = {}

  for(var key in app.config.SQLITE){
    var con = app.config.SQLITE[key]; 
    con.engine = 'sqlite';
    mex[key] = {
      
      key: key,
      param: con,
      config:con,
      
      query: function(sql,multi,cb){
        query(key,sql,multi,cb)
      },

      mquery: function(sql,multi,cb){
        mquery(key,sql,multi,cb)
      },
      
      exec: function(sql,cb){
        exec(key,sql,cb)
      },
      
      upsert: function(table,data,cb){
        var vals=[],keys = Object.keys(data);
        keys.map(function(key){vals.push(data[key])})
        vals = `'${vals.join("','")}'`;
        var sql = `INSERT OR REPLACE INTO ${table} (${keys.join(',')}) VALUES (${vals});`;
        mex[key].exec(sql,cb);
      },

      aquery: promisify(function(sql,multi,cb){
        mex[key].query(sql,multi,function(res){
          var err; if(res.error) err=res.msg.message;
          cb(err,res);
        }); 
      }),
      
      aexec: promisify(function(sql,cb){
        mex[key].exec(sql,function(res){
          var err; if(res.error) err=res.msg.message;
          cb(err,res);
        }); 
      }),
 
      aupsert: promisify(function(table,data,cb){
        mex[key].upsert(table,data,function(res){
          var err; if(res.error) err=res.msg.message;
          cb(err,res);
        }); 
      }),
    
    }

    /*
    function lastpath(paths){
      var found;
      if(!paths) return found;
      if(typeof paths=='string') paths=[paths];
      paths.map(function(path){
        if(app.mod.fs.existsSync(path)) found = path;  
      });
      return found;
    }
    */

    // Set database path here.
    mex[key].param.path = app.resolve(mex[key].param.database);
    if(! app.mod.fs.existsSync(mex[key].param.path)) ce(mex[key].param.path,'does not exist');
    // cl('@@ litepath:',mex[key].param.path);
  
  }

  function dbConnect(key){
    var db = new sqlite3.Database(mex[key].param.path,{
      busyTimeout : mex[key].param.timeout_ms  
    });
    return db;  	
  }

  function errmsg(err,sql){
    var msg = err.message.replace(/SQLITE_ERROR:/ig,'Error:');
    //if(fn.debug===true) msg += ' > '+sql+' <';
    return ({"error":true, "msg":msg});
    ce('ERROR:'+msg);
  }
  
  function query(key,sql,multi,cb){
  	var start = new Date();
  	var db = dbConnect(key);
  	db.all(sql, function(err,rows) { 
  		db.close(); 
  		if(err) return cb(errmsg(err,sql));
      else if(!multi) {
        if(rows.length==0) cb({})
        else cb(rows[0]);
      }
      else cb(rows);
      cl(sql+' ( Fetched '+rows.length+' rows in '+(new Date()-start)+' ms )')
  	});
  }

  function mquery(key,sql,multi,cb){
    var rows = [], sqls=sql.split(';');
    async.eachSeries(sqls, function(sql,next){ 
      query(key,sql,multi,function(rs){
        //{"error":true,"msg":"SQLITE_MISUSE: not an error"}
        if(!rs.error) rows.push(rs);
        next();
      })  
    },function(){
      cb(rows);  
    })
  }
  
  function exec(key,sql,cb){
  	var start = new Date();
  	var db = dbConnect(key);
  	sql = sql.replace(/\'null\'/g,null);
  	db.exec(sql,function(err){ 
  		db.close();
  		if(err) return cb(errmsg(err,sql));
  		cb({error:false, msg:"Update success."});
      cl(sql+' ( Executed in '+(new Date()-start)+' ms )')
  	});
  }	

  return mex;
 
}
