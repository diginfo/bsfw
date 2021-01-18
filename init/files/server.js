// define as global so available in all modules below here.
global.app = require('bsfw');
module.exports = app;

// Main
process.on('exit', app.onExit.bind(null,{cleanup:false}));
process.on('SIGINT', app.onExit.bind(null, {exit:true}));
process.on('uncaughtException', app.onExit.bind(null, {exit:true}));

// override the data path
app.path.data = app.mod.path.join(app.path.abs,'data');

// Use my local config file
app.define.config(app.mod.path.join(__abs,'config.json'));
//$.lib.fn.x($.config);

// add my sqlid objects (from files)
//app.define.sqlid(require('./lib/sqlid_'));

// add my local views
app.define.view(app.mod.path.join(__abs,'views'));

// add my libs / mods
//app.define.lib('xxx',app.mod.path.join(__dirname,'lib/xxx.js'))

// add my timed events 
//app.define.timed(app.lib.send.go,app.lib.read.go);

// start if not run as a module.
if (require.main === module) {
  app.nocache();
  app.start();
}