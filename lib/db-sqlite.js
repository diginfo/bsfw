const promisify   = $.util.promisify;
const path        = $.path;
const async       = $.async;
const sqlite3     = require('sqlite3');

module.exports = function(){
  
  const mex = {}

  for(var key in $.config.SQLITE){
    var con = $.config.SQLITE[key]; 
    
    mex[key] = {
      
      key: key,
      param: con,
      
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
    
    // Set database path here.
    mex[key].param.path = altpath(
      mex[key].param.database,
      path.join(__dirname,'../',mex[key].param.database)
    );
   
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


function altpath(path1,path2,path3){
  if ($.fs.existsSync(path1)) return path1;
  else if ($.fs.existsSync(path2)) return path2;
  else if (path3 && $.fs.existsSync(path3)) return path3;
  return false;
}