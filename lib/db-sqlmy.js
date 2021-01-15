function errmsg(msg,sql){
  /*
    Error - No Such Field: Unknown column 'undefined' in 'field list'
    ER_DUP_ENTRY: Duplicate entry '10TON-160410' for key 'PRIMARY'
    Error - Syntax: 'WHERE ID = '$ID'' at line 1
    ER_UNKNOWN_SYSTEM_VARIABLE:
    ER_TOO_MANY_ROWS: Result consisted of more than one row.
  */
  
  msg = msg
    .replace(/ER_NO_SUCH_TABLE:.*/,'DB Error - No Such Table.')
    .replace(/ER_DUP_ENTRY:.*/,'DB Error - Record Exists.')
    .replace(/ER_BAD_FIELD_ERROR:.*/,'DB Error - No Such Field.')
    .replace(/ER_PARSE_ERROR:.*/,'DB Error - Bad Syntax.')
    .replace(/^ER_SIGNAL_EXCEPTION: */,'')
    .replace(/^ER_TOO_MANY_ROWS:.*/,'DB Error - Too Many Rows.')
  //if(process.env.NODE_ENV.toLowerCase()=='development') msg += '\r\n'+sql;
  //if(app.debug) msg += '\r\n'+sql;
  ce(`[mysql]:${msg}\n${sql}`);
  return msg;
}

function msecs(start,sql){
  var ms = new Date() - start;
  return ms;
}

function conend(con){
  con.end();
}

module.exports = function(app){
  const promisify = app.mod.util.promisify;
  const mysql = require('mysql');
  
  const mex = {}

  for(var key in app.config.MYSQL){
    
    var param = app.config.MYSQL[key];
    
    mex[key] = {
      
      param: {
        host                : param.server,
        user                : param.userName,
        password            : param.password,
        database            : param.database,
        multipleStatements  : true        
      },
       
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

  function query(db,sql,multi,cb){
    var start = new Date();
    var con = mysql.createConnection(mex[db].param);
    con.query(sql,function(err,rs) {
  		if(err) {
    		var msg = errmsg(err.message,sql);
    		conend(con);
    		
    		cb({
      		error   : true,
      		msg     : msg
        });
    		
    		ce(msg);
      }  
      
      else {
  		  var rows = [...rs], len=rows.length;
  		  rs = null;
  		  if(!multi) rows = rows[0] || {};
  		  
  		  // paging
  		  if(sql.indexOf('SQL_CALC_FOUND_ROWS') != -1) {
    		  con.query("SELECT FOUND_ROWS() as TOTAL",function(err,res){ 
            conend(con);
            var tot = res[0].TOTAL; 
            cb({
              rows  : rows, 
              total : tot
            });
            cl(`${sql} ( Fetched ${len} of ${tot} rows in ${msecs(start,sql)} ms )`); 
          });
        }
        
        else { 
          conend(con);
          cb(rows);
          cl(`${sql} ( Fetched ${len} rows in ${msecs(start,sql)} ms )`)
        }  	
      }
    });

  }

  function exec(db,qry,cb){
  	var start = new Date();
  	var con = mysql.createConnection(mex[db].param);
    con.connect(src,sql,function(my){
      con.query(sql,function(err,rs) {
    		conend(con); 
    		if(err) {
      		var msg = errmsg(err.message,sql); 
      		cb({
        		error : true,
        		msg   : msg
          });
      		
      		ce(msg);
        } 		
    		
    		else if(rs.affectedRows===0) cb({
      		error : true,
      		msg   : 'No Matching Record.'
        });
    		
    		else cb({
      		error : false,
      		msg   : 'Execute Success.'
        });
    		
    		cl(sql.substr(0,1000) + ' ( Executed in '+msecs(start,sql)+' ms )')
      });
    })     
    
  }

  return mex;

}