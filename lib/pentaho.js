var net = require('net');
var fn = $.lib.fn;
var db = $.lib.db;

module.exports = {
  config  : {
    host  : '127.0.0.1',
    port  : 9898,
    dbsrc : 'MYDEV',
  },
  init    : init,
  get     : pho_java,
  phopath : phopath    
}

const mex = module.exports;

function init(){
  app.bhave.get('pentaho',function(res){
    if(res.port && res.host) module.exports.config = res;
    alive(function(res){
      cl(res);  
    });
  })
}

function phopath(fname, type){
  var locn = {
    'group': $.__grpdata+fname,
    'site': $.__data+"prpt/"+fname,
    'standard': $.__cwd+"prpt/"+fname
  };
  if(type) return locn[type];
  else return locn;
}


function alive(cb){
  var sock = net.connect(module.exports.config.port, module.exports.config.host); 
  sock.on('error', function(err){
    fn.ce("Pentaho Server: "+err.message);
    if(cb) return cb({error:true, msg:err.message});
  }).on('connect', function() {
    sock.destroy();
    if(cb) cb({error:false,msg:`Pentaho running on ${module.exports.config.host}:${module.exports.config.port}`});
  })
}

//### PENTAHO-JAVA ###
function pho_java(req,res,cb){
  var qry = req.query;

  var mime = {
    'html:':'text/html',
    'pdf':'application/pdf',
    'xls':'application/vnd.ms-excel',
    'excel':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'rtf':'application/rtf',
    'csv':'text/csv',
    'text':'text/plain'
  }
  
  //var fname = qry._xldata.split('^').slice(-1)[0];
  var fname = qry._fname || 'chart_test.prpt';
  if(!(/\./).test(fname)) fname += '.prpt';
  
  // search 3 locations for file
  //var locn = phopath(fname);
  var paths = $.paths.pentaho.reverse();
  var path = $.lib.fn.altpath(paths,fname);
  
  if(!path) fn.ce(fname+' file NOT found.')
  //cl('@@@ SEARCHING PATHS... @@'); fn.cl('std:'+locn.standard); fn.cl('group:'+locn.group); fn.cl('site:'+locn.site); fn.cl('final path: '+path);
  
  qry._type = qry._type || 'pdf';
  if(qry._type == "xlsx") qry._type = "excel";
  
  /*
  var sids = [], sites = fn.getsites();
  for(var site in sites){
    sids.push({id:sites[site].env.SITEID,db:sites[site].env.DBSA.name})
  }
  */
  
  //fn.cl(db);
  
  fn.cl(db);
  var con = db.MYDEV.param
  
  var pobj={
    conn: {
      'user':       con.user,
      'password':   con.password,
      'host':       con.host,
      'database':   con.database,
      'engine':     'MYSQL'.toLowerCase(),
      'sqlite':     '/usr/share/dev/nodejs/run/pure3/data/dwap.db'    
    },
    
    param: {
      '_pureport':  process.env.PORT,
      '_isdev':     $.isdev,
      '_docref':    qry._docref || '',
      
      /*
        '_sites':     sids,     
      '_imgpath':   $.__data+"public/files/",
      '_qrpath':    $.qrcode.path,
      '_planplus':  $.planplus || false,
      */
      
      /*
      'format':     qry._type,
      'file':       path,
      'req_file':   fname,
      
      */
      
      '_path':      path,
      '_format':    qry._type,
      '_fname':     fname
    }
  }
  
  for(var key in qry){
    if(key.indexOf('_') !== 0) pobj.param[key] = qry[key];
  }
  
  /*
  if(qry._udata){
     if(qry._udata.groups) pobj.param._pureugrps = qry._udata.groups;
     if(req.session.user_id) pobj.param._userid = req.session.user_id;
     if(qry._udata.name_first) pobj.param._pureuid_namefirst = qry._udata.name_first;
     if(qry._udata.name_last) pobj.param._pureuid_namelast = qry._udata.name_last;
  }
  */
  
  if('session' in req && req.session.udata) {
    pobj.param._userid              = req.session.udata.userid;
    pobj.param._pureuid             = req.session.udata.userid;
    pobj.param._pureuid_namefirst   = req.session.udata.name_first;
    pobj.param._pureuid_namelast    = req.session.udata.name_last;
    
    pobj.param._pureuid_department  = req.session.department;
    pobj.param._pureuid_email       = req.session.udata.email;
    pobj.param._pureuid_position    = req.session.udata.position;
    pobj.param._pureuid_ic_number   = req.session.udata.ic_number;
   
    pobj.param._pureuid_ip_addr     = req.session.udata.ip_addr
    pobj.param._pureuid_language    = req.session.udata.language
    pobj.param._pureuid_sysadm      = req.session.udata.sysadm
    pobj.param._pureugrps           = req.session.udata.groups;
  }
  
  // 180827 - prevent pentaho fail when no user id supplied.
  pobj.param._userid = pobj.param._userid || "";
  pobj.param._pureuid = pobj.param._pureuid || "";
  
  // 190318- Free User Param Filters
  pobj.param._runmode = $.runmode;
  pobj.param._freeuid = "";
  if(qry._freeid) pobj.param._freeuid = qry._freeid.userid;
  
  // Add codata to params.
  for(var key in $.codata){pobj.param['_'+key] = $.codata[key];}
  

  pobj = require('./pho.json');
  
  cl('@@ pentaho vars:',fn.jsonString(pobj));
  
  if(qry.sqlid) {
    pobj.tables = {};
    var bits = qry.sqlid.split('^');
    $.mods[bits[0]][bits[1]](qry,function(res){
      pobj.tables[qry.sqlid] = res;
      go();    
    })  
  }
  else go();

/*
   #2336 - Pure api call: http://localhost:3030/?_api=y&_func=get&_format=json&userid=SYSTEM&_sqlid=admin^security_ipquery
   
   @@ pentaho vars: {"conn":{"user":"root","password":"bukit8002","host":"puredb","database":"MYDEV","engine":"mysql","sqlite":"/usr/share/dev/nodejs/run/pure3/data/dwap.db"},"param":{"_pureport":"3030","_isdev":true,"_docref":"","_sites":[{"id":"omssgtest","db":"OMSSGTEST"},{"id":"dis","db":"MYDEV"},{"id":"free","db":"FREE"}],"_imgpath":"/usr/share/dev/nodejs/run/pure3/data/public/files/","_qrpath":"/usr/share/dev/nodejs/run/pure3/data/public/qr","_planplus":true,"_path":"/usr/share/dev/nodejs/run/pure3/prpt/allowed_ip_security.prpt","_format":"pdf","_fname":"allowed_ip_security.prpt","_userid":"PAC","_pureuid":"PAC","_pureuid_namefirst":"Peter","_pureuid_namelast":"Cruickshank","_pureuid_email":"pac@dis.com.sg","_pureuid_position":"Towkay","_pureuid_ic_number":"S2649626H","_pureuid_ip_addr":"45.119.154.253","_pureuid_language":"eng","_pureuid_sysadm":true,"_pureugrps":["OPN-GRL","SYSADM","CAL-EDITOR","CERTDELETOR","CF-EDITOR","CPAR-EDITOR","INSTRUCTOR","NCR-APPROVE","NCR-EDITOR","PART-DETAIL-UPD","PART-UD","OTD-EDITOR","SALES-PRICING","TASK-EDITOR","JOB-STATUS"],"_runmode":"default","_freeuid":"","_couid":"dis","_coname":"DiGiTaL Information Systems Pte Ltd","_coaddr1":"1001, Jalan Bukit Merah","_coaddr2":"#06-20","_coaddr3":"Singapore, 159455 ","_coalias":"Pure3","_currency_id":"USD","_gst_id":"GST6","_cotel":"+65 93884440","_cofax":null,"_remitname":null,"_remitaddr1":null,"_remitaddr2":null,"_remitaddr3":null,"_remittel":null,"_remitfax":null,"_groupuid":"dis","_costing_currency_id":"USD"}}
*/
  
  function go(){
    var socket = net.createConnection(module.exports.config.port, module.exports.config.host);
    cl('@@@@@@@@@',typeof(res));
    //if(req.session){
    // user-called report show in browser.
    if(typeof(res)!='function'){ 
      
      res.setHeader("Content-Type",mime[qry._type]);
      //res.setHeader('Content-disposition', 'attachment; filename=' + 'xxx.pdf');
      
      socket.on('data', function(data) {
        cl('data',data)
        res.write(data);
      }).on('connect', function() {
        cl('@@ connect',fn.jsonString(pobj)+"\r\n")
        
        socket.write(fn.jsonString(pobj)+"\r\n");
      }).on('end', function() {
        cl('end');
        res.end();
      }).on('error', function(err){
        cl('error');
        fn.ce("Pentaho Server: "+err.message);
        if(cb) return cb({error:true, msg:err.message});
      })
    } 
    
    // event-called report - save to file.
    else {
      
      var extn = {
        'pdf': '.pdf',
        'excel': '.xlsx',
        'html': '.html'  
      }[pobj.param._format.toLowerCase()];
      var opfn = fname.replace('.prpt',extn);
      
      var chunks = [];
      socket.on('data', function(data) {
        chunks.push(data);
      }).on('connect', function() {
        socket.write(fn.jsonString(pobj)+"\r\n");
      }).on('end', function() {
        socket.destroy();
        var data = Buffer.concat(chunks); 
        res({ 'name': opfn, 'data':data });
         //console.log('@@@ DEBUG > ' + pobj.param._coalias+': '+opfn+': '+data.length);
         cl('@@@ DEBUG > ' + pobj.param._coalias+': '+opfn+': '+data.length);
        chunks=null; data=null;
      }).on('error', function(err) {
        var msg = 'Pentaho cannot generate report: '+path;
        ce(msg,err.message);
        return res({error:true, msg:msg});
      });     
      
    }
  }     
}

/*
function phoget(req,res,cb){ 
  //if(global.isdev) pho_java(req,res,cb);
 // fn.cl(req);
  if(req.query._class=='pure') pho_java(req,res,cb);
  else pho_tomcat(req,res,cb);
} 
*/

init();
