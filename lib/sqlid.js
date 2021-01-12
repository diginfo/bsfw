var grid_data = {
  total : 4,
  rows  : [
    {row:1,first:'Mark',last:'Otto',handle:'@mdo'},
    {row:2,first:'Jacob',last:'Thornton',handle:'@fat'},
    {row:3,first:'Larry',last:'Bird',handle:'@twitter'},
    {row:4,first:'Dave',last:'Lock',handle:'@key'},
  ]
}

module.exports = {

  // test & debug only
  echo: (qry,cb) => {
    cb(qry);
  },

  // test & debug only
  form:{
    get: (qry,cb) => {
      cb(qry);
    },

    put: (qry,cb) => {
      cb({alert:true,error:false,msg:'FORM-PUT Success',data:qry}); 
    },
  
    del: (qry,cb) => {
      cb({alert:true,error:false,msg:'FORM-DELETE Success',data:qry}); 
    }
  },

  // test & debug only
  combo:{
    get: (qry,cb) => {
      cb([{value:'1',text:'Item One'},{value:'2',text:'Item Two'},{value:'3',text:'Item Three'},{value:'4',text:'Item Four'}])  
    },

    put: (qry,cb) => {
      cb({alert:true,error:false,msg:'COMBO-PUT Success',data:qry});    
    }
  },

  // test & debug only
  grid:{
    get: (qry,cb) => {
      cb(grid_data)  
    },
  
    put: (qry,cb) => {
      cb({alert:true,error:false,msg:'GRID-PUT Success',data:qry});    
    },
  
    del: (qry,cb) => {
      cb({alert:true,error:false,msg:'GRID-DELETE Success',data:qry});    
    }
  },
  
  // test & debug only
  seq:{
    get:(qry,cb) => {
      var arr=[]
      for(var x=1;x<=10;x++){
        arr.push({value:x,text:x})
      }
      cb(arr)
    }
  },
  
  db: {
    
    get: (qry,cb) => {
      $.lib.fn.configGet('MSSQL',function(data){
        return cb(data.VMFG);
      });
    },

    put: (qry,cb) => {
      $.lib.fn.configPut({
        MSSQL:{
          VMFG:{
            server    : qry.server,
            userName  : qry.userName,
            password  : qry.password,
            database  : qry.database,
          }
        }
      },cb)
      
    }
  },
  
  em: {
    
    get: (qry,cb) => {
      $.lib.fn.configGet('MAIL',cb);
    },
  
    put: (qry,cb) => {
      $.lib.fn.configPut({
        MAIL:{
          IMAP_SVR    : qry.IMAP_SVR,
          IMAP_PORT   : qry.IMAP_PORT,
          SMTP_SVR    : qry.SMTP_SVR,
          SMTP_PORT   : qry.SMTP_PORT,
          UID         : qry.UID,
          PWD         : qry.PWD,
          TLS         : qry.TLS,        
        }  
      },cb) 
    }
  },
  
  users_combo: {
    get: (qry,cb) => {
      $.lib.db.VMFG.query(`select name as value ,name as text ,name as USER_NAME from sysusers where name not like '%#' and name not like 'db%' and name not in('dbo','guest','sys','INFORMATION_SCHEMA','PUBLIC') order by name asc`,true,cb);
    }
  },
  
  pas_users_combo:{
    get: (qry,cb) => {
      $.lib.db.VMFG.query(`select USER_ID as value ,USER_ID as text ,USER_EMAIL AS APPROVER_EMAIL from PAS_USERS order by USER_ID asc`,true,data);
    }
  },
  
  user:{
    get: (qry,cb) => {
      $.lib.db.VMFG.query(`select USER_ID,USER_EMAIL as EMAIL ,USER_NAME from PAS_USERS where USER_ID='${qry.USER_ID}'`,false,function(data){
        if (data=="{}") data={'USER_ID':qry.USER_ID,'USER_NAME':qry.USER_ID}
        cb(data)
      })
    },
  
    put:(qry,cb) => {
      var sql=`DELETE FROM PAS_USERS where USER_ID='${qry.USER_ID}'; INSERT INTO PAS_USERS(USER_ID,USER_NAME,USER_EMAIL) VALUES('${qry.USER_ID}','${qry.USER_NAME}','${qry.EMAIL}');`;
      $.lib.db.VMFG.exec(sql,cb);
    },
    
    del:(qry,cb) => {
      $.lib.db.VMFG.exec(`DELETE FROM PAS_USERS where USER_ID='${qry.USER_ID}'`,cb);
    },
  },
  
  cc_combo: {
    get:(qry,cb) => {
      $.lib.db.VMFG.query('select DISTINCT CC_ID as value,CC_ID as text from PAS_CC_APPRV_GROUP ORDER BY CC_ID ',true,cb)
    }
  },
  
  cc: {
    get:(qry,cb)=>{
      $.lib.db.VMFG.query(`SELECT ROWID,CC_ID,SEQ,CC_LIMIT,APPROVER_NAME,APPROVER_EMAIL FROM PAS_CC_APPRV_GROUP ORDER BY CC_ID ASC,CC_LIMIT ASC,SEQ ASC   `,true,function(data){
        cb({rows:data})
      })
    },
  
    put:(qry,cb)=>{
      var limit=qry.CC_LIMIT || 0;
      var sql=''
      if (qry.ROWID) sql+=`DELETE FROM PAS_CC_APPRV_GROUP WHERE ROWID=${qry.ROWID};`;
      sql+=`INSERT INTO PAS_CC_APPRV_GROUP(CC_ID,SEQ,CC_LIMIT,APPROVER_NAME,APPROVER_EMAIL) VALUES('${qry.CC_ID}','${qry.SEQ}',${limit},'${qry.APPROVER_NAME}','${qry.APPROVER_EMAIL}')`
      $.lib.db.VMFG.exec(sql,function(data){
        cb(data)
      })
    },
  
    del:(qry,cb)=>{
      $.lib.db.VMFG.exec(`DELETE FROM PAS_CC_APPRV_GROUP WHERE ROWID=${qry.ROWID}`,cb)
    }
  },
  
  apprvbkp: {
    
    get:(qry,cb)=> {
      $.lib.db.VMFG.query("SELECT ROWID,APPROVER_EMAIL,BACKUP_EMAIL,CONVERT(char(10), START_DATE,126) as START_DATE,CONVERT(char(10), END_DATE,126) as END_DATE FROM PAS_CC_APPRV_BACKUP",true,(data)=>{
        cb({rows:data})
      })
    },
  
    put:(qry,cb)=>{
      var sql='';
      if (qry.ROWID) sql+=`DELETE FROM PAS_CC_APPRV_BACKUP WHERE ROWID=${qry.ROWID}`
      sql+=`INSERT INTO PAS_CC_APPRV_BACKUP(APPROVER_EMAIL,BACKUP_EMAIL,START_DATE,END_DATE) VALUES('${qry.APPROVER_EMAIL}','${qry.BACKUP_EMAIL}','${qry.START_DATE}','${qry.END_DATE}')`
      $.lib.db.VMFG.exec(sql,cb);
  
    },
  
    del:(qry,cb)=>{
      $.lib.db.VMFG.exec(`DELETE FROM PAS_CC_APPRV_BACKUP WHERE ROWID=${qry.ROWID}`,cb)
    }
  
  },
  
  po_combo:{
    get:(qry,cb)=>{
      var sql='SELECT DISTINCT PO_ID AS value,PO_ID AS text FROM PAS_PO_LINE_LOG ORDER BY PO_ID DESC '
      $.lib.db.VMFG.query(sql,true,cb)
    }
  },
  
  pol: {
    get:(qry,cb)=>{
      /*CONVERT(char(10), EMAIL_DATE,126) as */
      var sql=`SELECT ROWID,PO_ID,CC_ID,CC_LIMIT,APPROVER,APPROVER_EMAIL,BACKUP_EMAIL,
      case when ISNULL(STATUS,'')='' then '' WHEN STATUS='A' then 'Approved' WHEN STATUS='R' then 'Rejected' END as STATUS ,EMAIL_FLAG,CONVERT(VARCHAR, EMAIL_DATE,22) as EMAIL_DATE FROM PAS_PO_LINE_LOG `
      if(!qry.PO_ID)  sql+=` WHERE 1=1 `
      else sql+=` WHERE PO_ID='${qry.PO_ID}' `
      sql += ` ORDER BY PO_ID DESC,ROWID ASC `
      $.lib.db.VMFG.query(sql,true,data=>{
        cb({rows:data})
      })
  
    }
  },
  
  purchasing: {
    get:(qry,cb)=>{
      $.lib.db.VMFG.query(`select EMAIL_ADDRESS from PAS_PURCHASING`,false,function(rs){
        cl('purchasing_get:',rs)
        cb(rs)
      });
    },
    
    put:(qry,cb)=>{
      var sql=`DELETE FROM PAS_PURCHASING;INSERT INTO PAS_PURCHASING(EMAIL_ADDRESS) VALUES('${qry.EMAIL_ADDRESS}')`
      $.lib.db.VMFG.exec(sql,function(rs){
        if (rs.err)return cb({error:true,msg:rs.err});
        else cb(rs)
      })
    }
  },
}

module.exports.add = function(lib){
  module.exports = Object.assign(module.exports,lib)
}


