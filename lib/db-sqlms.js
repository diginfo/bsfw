module.exports = function(app){

  const promisify     = app.mod.util.promisify;
  const tedious       = require('tedious')
  const Connection    = tedious.Connection;
  const Request       = tedious.Request;
  
  const mex = {
    
  }

  function param(dbid){
    var db = app.config.MSSQL[dbid];
    db.engine = 'mssql';
    return {
      server          : db.server,
      authentication  : {
        type          : 'default',
        options       : {
          userName    : db.userName,
          password    : db.password
        }
      },
      
      options: {
        database                    : db.database,
        encrypt                     : false,
        useUTC                      : false,
        multipleStatements          : true,
        validateBulkLoadParameters  : false
      }
    }  
  }
  
  // MSSQL
  for(var key in app.config.MSSQL){
    
    // console.log(key,param(key));
    
    mex[key] = {
      param: param(key),
      config:app.config.MSSQL[key],
      query: function(sql,multi,cb){
        query(key,sql,multi,cb)
      },
      
      exec: function(sql,cb){
        exec(key,sql,cb)
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
      })
    } 
  }

  function connect(db,cb){
    var con = new Connection(mex[db].param);
  	con.on("connect", function(err) {
  		if(err) return cb({"error":true,"msg":err.message,"con":null});
      return cb({"error":false,"msg":'connected',"con":con}); 
    });
    con.connect();
  }
  
  //## MSSQL UPDATE / INSERT
  function exec(db,sql,cb){
    connect(db,function(con){
      if(con.error) return cb(con);
  		var request = new Request(sql, function(err,rowCount) {
        con.con.close();
        return cb({"error":false,"msg":"Execute Success."});
  		});
  		con.con.execSql(request);
    })
  }
  
  //## MSSQL Get Row(s)
  function query(db,sql,multi,cb){
    connect(db,function(con){
      if (con.error) return cb(con);
      if(multi) var rowdat = []; else var rowdat = {};
      var start = new Date();
      var request = new Request(sql, function(err, rowCount) {
        con.con.close();
        if(err) return ({"error":true,"msg":sql+';'+err.message}); 
        else cb(rowdat); 
        cl(sql+' ( Fetched '+rowCount+' rows in '+(new Date()-start)+' ms )');
        rowdat=null; col=null; cols=null, sql=null;
      });
      
      con.con.execSql(request);	 	
      
      request.on('row', function(columns) {
        var cols = {};
        columns.forEach(function(column) {
          var col = {}; 
          if(column.value === null) column.value = '';
          if(multi) cols[column.metadata.colName] = column.value;
          else rowdat[column.metadata.colName] = column.value;
        });
        if(multi) rowdat.push(cols);
      })        
    });
  }
  
  return mex;
}


/*
function upmulti(table,key,data){
  var whens = [];
  var keys = Object.keys(data);
  for(var k in data){
    whens.push(`WHEN '${k}' THEN '${data[k]}'`)  
  }

  return `UPDATE ${table} SET ${key} = CASE ${whens.join(' ')} END WHERE ${key} IN ${fn.dbinlist(keys)};`;    
}
*/