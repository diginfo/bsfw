const path = require('path');
const app = module.parent.exports;

module.exports = {
  
  config        : function(){
    return config;
  },
  
  x             : function(msg){
                    console.error(msg);
                    process.exit()
                  },
  
  cl            : console.log,
  ce            : console.error,
  ci            : console.info,
  
  salt          : 'hdsdsfhgdfshgfaghfs',
  
  arr2obj       : arr2obj,
  sleep         : sleep,
  replaceNbsps  : replaceNbsps,
  findWithAttr  : findWithAttr,
  encrypt       : encrypt,
  decrypt       : decrypt,
  asArray       : asArray,
  error         : error,
  dbinlist      : dbinlist,
  help          : help,
  args          : args,
  style         : style,
  funcargs      : funcargs,
  cmdexe        : cmdexe,
  debug         : debug,
  isObject      : isObject,
  merge         : merge,
  jsonGet       : jsonGet,
  jsonPut       : jsonPut,
  jsonString    : jsonString,
  altpath       : altpath,
  fileOlder     : fileOlder,
  
}

const crypto = require('crypto');
const mex = module.exports;

// alternative file paths
function altpath(paths,fname){
  for(var i in paths){
    var fn = path.join(paths[i],fname);
    if (app.mod.fs.existsSync(fn)) return fn;    
  }
  return null;
}

// functions need to add to appfunc.
function fileOlder(path,secs){
	try{return ((new Date - app.mod.fs.statSync(path).mtime) /1000) > secs}
	catch(e){return false};
}

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function merge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        merge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return merge(target, ...sources);
}

function debug(...args){
  console.log(...args);  
}

function style(str,sty,noclr){
  var cols={res: "\x1b[0m",bright : "\x1b[1m",dim : "\x1b[2m",ul : "\x1b[4m",blink : "\x1b[5m",rev : "\x1b[7m",hide : "\x1b[8m",fgk : "\x1b[30m",fgr : "\x1b[31m",fgg : "\x1b[32m",fgy : "\x1b[33m",fgb : "\x1b[34m",fgv : "\x1b[35m",fgc : "\x1b[36m",fgw : "\x1b[37m",bgk : "\x1b[40m",bgr : "\x1b[41m",bgg : "\x1b[42m",bgy : "\x1b[43m",bgb : "\x1b[44m",bgv : "\x1b[45m",bgc : "\x1b[46m",bgw : "\x1b[47m"};
  
  if(typeof sty =='string') sty=[sty];
  sty.map(function(e){str = cols[e]+str;})
  if(!noclr) str += cols['res'];
  return str;
}

async function cmdexe(mods,arg){
  if ((arg.fnc in mods[arg.mod]) && typeof mods[arg.mod][arg.fnc] === "function"){
    var par = funcargs(mods[arg.mod][arg.fnc]);
    if(par.indexOf(/cb|cb=/) > -1) return mods[arg.mod][arg.fnc](...arg.opt,cl);
    var res = await mods[arg.mod][arg.fnc](...arg.opt);
    if(res) cl(res);
  } 
}

// returns object {mod,fnc,arg}
function args(){
  var args = process.argv.slice(2).filter(function(e){return e});
  if(args.length == 0) return ({mod:null,fnc:null,opt:[]})
  var mod = args.shift().trim();
  if(args.length == 0) return ({mod:mod,fnc:null,opt:[]})  
  var fnc = args.shift().trim();  
  return ({mod:mod,fnc:fnc,opt:args});
}

function funcargs(func) {
  var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
  var ARGUMENT_NAMES = /([^\s,]+)/g;
  var fnStr = func.toString().replace(STRIP_COMMENTS, '');
  var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if(result === null)
     result = [];
  return result;
}

function help(mods,valid){
  function func(fid,fnc,mid){
    var args = []; funcargs(fnc).map(function(arg){
      if(!arg.match(/cb=|cb|\.\.\.args/)) args.push(arg);  
    })
    
    if(args.length == 0) cl(style(`vpas ${mid} ${fid}`,'fgc'));
    else cl(style(`vpas ${mid} ${fid} [${args.join( )}]`,'fgc'));
  }

  function module(mid){
    if(mods[mid].help) mods[mid].help();
    Object.keys(mods[mid]).map(function(key){
      if(typeof mods[mid][key] === "function") {
        func(key,mods[mid][key],mid);
      }
    })
  }

  function allmods(){
    Object.keys(mods).map(function(mod){
      if(valid && valid.indexOf(mod) < 0 ) return;
      cl(`\n${mod}\n=====`);
      Object.keys(mods[mod]).map(function(key){
        if(typeof mods[mod][key] === "function") func(key,mods[mod][key],mod);
      })    
    });    
  }
  
  var arg = args();
  if(!arg.fnc){
    cl()
    cl(style('=== HELP ===','bgb'))
    if(arg.mod && mods[arg.mod]) module(arg.mod);
    else allmods();
  } 
  
  return arg;
  
}

function jsonPut(fname,wdata){
  const rdata = jsonGet(fname);
  var data = merge(rdata,wdata);
  try {
    app.mod.fs.writeFileSync(fname, jsonString(data),'utf-8');
    return(data);
  } catch(e){
    return ({error:true,msg:e.message})  
  }
}

function jsonParse(str,msg){
  msg = msg||'';
  try {return JSON.parse(str);}
  catch(err){
	  if(msg) ce(msg,'JSON.parse ERROR:'+str);
	  else ce('JSON.parse ERROR:'+str);
	  return{};
  }
}

function jsonString(obj,a1=null,a2=2){
  try {return JSON.stringify(obj,a1,a2)}
  catch(err){ce('Error: JSON.stringify()'); return '';}
}  

function jsonGet(fn){
  try {
    return jsonParse(app.mod.fs.readFileSync(fn, 'utf8'));
  } catch(e){
    return ({});
  }
}

function dbinlist(array){
  var list = array.map(function(item){
    return `'${item}'`;
  }).join(",");
  return `(${list})`;
}

function error(msg,key,val){
  msg.error = true;
  msg.errors[key] = val;
  return msg;  
}

function asArray(val){
  if(val===undefined) return [];
  if(!Array.isArray(val)) return [val];
  return val;  
}

function encrypt(text){
  var cipher = crypto.createCipher('aes-256-cbc',mex.salt)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt(text){
  var decipher = crypto.createDecipher('aes-256-cbc',mex.salt)
  try{
    var dec = decipher.update(text,'hex','utf8');
    dec += decipher.final('utf8');
    return dec;
  }
  catch(err){
    return false;
  }
}

function findWithAttr(array, attr, value) {
  for(var i = 0; i < array.length; i += 1) {
    if(array[i][attr] === value) {
      return i;
    }
  }
  return -1;
}

function replaceNbsps(str) {
  var re = new RegExp(String.fromCharCode(160), "g");
  return str.replace(re, "");
}

function sleep(ms){

  function sleep2(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  async function sleep1(ms) {
    console.log('Taking a break...');
    await sleep2(ms);
  }
  sleep1(ms);

}

function arr2obj(arr,par,chi){
  var obj = {};
  for (var i in arr){
    if(!obj[arr[i][par]]) obj[arr[i][par]] = [];
    if(chi) obj[arr[i][par]].push(arr[i][chi]);
    else obj[arr[i][par]].push(arr[i]);
  } 
  return(obj);
}




