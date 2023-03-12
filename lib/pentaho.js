const app = module.parent.exports;
var net = require('net');

module.exports = {
  config  : {
    host  : '127.0.0.1',
    port  : 9898,
    dbsrc : 'MYDEV',
  },
  
  get     : pho_java,  
}

const mimes = {
  'html'   : 'text/html',
  'pdf'     : 'application/pdf',
  'xls'     : 'application/vnd.ms-excel',
  'excel'   : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'rtf'     : 'application/rtf',
  'csv'     : 'text/csv',
  'text'    : 'text/plain'
}

const mex = module.exports;

// better to pull it in at execute time.
mex.config = app.get.bhave('pentaho') || mex.config;

/*
function alive(cb){
  var sock = net.connect(module.exports.config.port, module.exports.config.host); 
  sock.on('error', function(err){
    ce("Pentaho Server: "+err.message);
    if(cb) return cb({error:true, msg:err.message});
  }).on('connect', function() {
    sock.destroy();
    if(cb) cb({error:false,msg:`Pentaho running on ${module.exports.config.host}:${module.exports.config.port}`});
  })
}
*/

//### PENTAHO-JAVA ###
function pho_java(req,res,cb){
  
  // /pho/pdf/mysql/chart_test.prpt/?arg1=x&arg2=y
  var arg = {}, _;
  [_,_,arg.type,arg.conid,arg.fname] = req.path.split('/');
  arg.qry = req.query;

  if(!(/\.prpt/).test(arg.fname)) arg.fname += '.prpt';
  
  // search all prpt locations for file
  var paths = app.path.prpt.reverse();
  arg.path = app.lib.fn.altpath(paths,arg.fname);

  arg.type = arg.type || 'pdf';
  if(arg.type == "xlsx") arg.type = "excel";
  
  // get connection info.
  arg.conid = arg.conid.toUpperCase();
  arg.con = app.lib.db[arg.conid].config;
  
  /*
    app.path.abs = 
    bin:   /usr/share/dis/dev/nodejs/src/visual/pas/v2/bin/linux
    node:  /usr/share/dis/dev/nodejs/src/visual/pas/v2/node
  */
  
  // image path constructor
  var imgpath = app.config.BHAVE.pentaho.image_path;
  //if(imgpath[0] != '/') imgpath = app.mod.path.resolve(__dirname,'../../../',imgpath);
  if(imgpath[0] != '/') imgpath = app.mod.path.resolve(app.path.abs,imgpath);
  cl('pentaho-imgpath:',imgpath);
  if(!(/\/$/).test(imgpath)) imgpath += '/'; 
  
  arg.pobj = {
    conn: {
      'user':       arg.con.userName,
      'password':   arg.con.password,
      'host':       arg.con.server,
      'database':   arg.con.database,
      'engine':     arg.con.engine  
    },
    
    param: {
      '_imgpath':   imgpath,
      '_path':      arg.path,
      '_format':    arg.type,
      '_fname':     arg.fname
    }
  }

  for(var key in arg.qry){
    arg.pobj.param[key] = arg.qry[key]
  }
  
  // add user info
  if('session' in req && req.session.udata) {
    for(var key in req.session.udata){
      arg.pobj.param['_'+key] = req.session.udata[key];  
    }
  }
  
  // Add company data to params.
  for(var key in app.config.COMPANY){
    arg.pobj.param['_'+key] = app.config.COMPANY[key];
  }
  
  //cl('@@ pentaho vars:',app.lib.fn.jsonString(pobj));
  
  if(!arg.path) {
    return cb({error:true,msg:arg.path+' not found.'})
    ce(arg.fname+' file NOT found.');
  }
  
  go(arg,res); 
}

function go(arg,res){
  //cl(arg);
  
  // module.exports.config.host = "127.0.0.0";
  
  var socket = net.createConnection(module.exports.config.port, module.exports.config.host);
  
  if(typeof(res)!='function'){ 
    
    //cl(mimes,type)
    res.setHeader("Content-Type",mimes[arg.type]);
    
    socket
      .on('data', function(data) {
        res.write(data);
      })
    
      .on('connect', function() {
        var js = JSON.stringify(arg.pobj);
        socket.write(js+"\r\n");
      })
    
      .on('end', function() {
        res.end();
      })
    
      .on('error', function(err){
        ce("Pentaho Server: "+err.message);
        if(res) return res.json({error:true, msg:err.message});
      })
  } 
  
  // event-called report - save to file.
  else {
    
    var extn = {
      'pdf': '.pdf',
      'excel': '.xlsx',
      'html': '.html'  
    }[arg.type];
    
    var opfn = fname.replace('.prpt',extn);
    var chunks = [];
    
    socket
      
      .on('data', function(data) {
        chunks.push(data);
      })
      
      .on('connect', function() {
        socket.write(app.lib.fn.jsonString(arg.pobj)+"\r\n");
      })
      
      .on('end', function() {
        socket.destroy();
        var data = Buffer.concat(chunks); 
        res({ 'name': opfn, 'data':data });
        chunks=null; data=null;
      })
    
      .on('error', function(err) {
        var msg = 'Pentaho cannot generate report: '+path;
        ce(msg,err.message);
        return res({error:true, msg:msg});
      });     
    
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

