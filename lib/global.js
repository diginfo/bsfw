// logs
global.cl = console.log;
global.ce = console.error;
global.ci = console.info;

// global modules
global._async   = require('async')
global._path    = require('path')
global._fs      = require('fs')
global._crypto  = require('crypto')
global._util    = require('util')
global._pug     = require('pug')

// __root is the absolute;
var __abs = _path.join(__dirname,'../');
if (__abs.match(/snapshot/)) __abs = _path.dirname(process.argv[0]);
var __config  = _path.join(__abs,'config.json')

// global paths
global.paths = {
  abs       : __abs,
  config    : __config,
  lib       : __dirname,
  views     : _path.join(__dirname,'../','views'),
  templates : _path.join(__abs,'templates'),
  data      : _path.join(__dirname,'../','data'),
  parent    : {},
}

// create parent paths
var dir = _path.basename(global.paths['abs']) 
for(var k in global.paths){
  if(typeof paths[k] == 'string') paths.parent[k] = paths[k].replace(`${dir}/`,'');   
}

cl(global.paths);
//process.exit();

// config merge
global.config   = require(paths.config);
if (_fs.existsSync(paths.parent.config)) {
  global.config = Object.assign(global.config,require(paths.parent.config));
}

// journalctl logs.
function jclogs(){
  
  var levels = {
    alert   : 1,
    error   : 3,
    warn    : 4,
    info    : 6,
    log     : 7
  }
  
  for(var level in levels){
    const pri = levels[level];
    console[level] = function(...args) {
      var line = [`<${pri}>`];
      args.map(function(arg){
        if(typeof arg != 'string') try {arg = JSON.stringify(arg)} 
        catch(e){};
        line.push(arg); 
      })
      process.stdout.write(`${line.join(' ')}\n`); 
    }
  }
}

global.cj = function(...args){
  args.map(function(arg){cl(JSON.stringify(arg))})
}

global.platform = process.platform;
global.isbin = (/[\\\/]snapshot[\\\/]/).test(__dirname);


// require a library.
global.lib = function(path){
  if(!_path.extname(path)) path += '.js';
  var par = _path.join(paths.parent,'lib',path);
  var loc = _path.join(paths.lib,path); 
  if (_fs.existsSync(par)) return require(par);
  return require(loc);
}

// alias
global.libs = global.lib;

if(isbin) jclogs();
//cj(paths,config);
//cl('binary:',isbin,'os:',platform);



