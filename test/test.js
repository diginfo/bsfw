app = require('../');

cl($.paths.cwd);

var pho = require('../lib/pentaho');

var test = {

  backup: function(){
    $.lib.user.backup();  
    $.lib.user.restore(cl);
    cl($.sstore.sessions)
  },

  pho: function(){
    $.paths.pentaho.push($.path.join(__dirname,'./prpt'))
    
    
    var res = {
      setHeader: cl,
      end: cl
    };
    
    var req = {
      query:{_fname:'chart_test.prpt'}
    } 
    
    pho.get(req,res,function(err){
      cl(err)
    });
  },
  
  view: function(){
    app.view.define($.path.join(__dirname,'views'));
    test.render('test');
  },
  
  api: function(){
    //test.sqlid();
    app.api({
      func    : 'get',
      sqlid   : 'echo',
      hello   : 'world',
      company : 'dis', 
    },cl)  
  },
  
  lib: function(){
    app.lib.define('test',$.path.join(__dirname,'sqlid.js'));
    $.lib.test.techo.get({hello:'world'},cl);  
  },
  
  config: function(){
    app.config.define($.path.join(__dirname,'config.json'));
    cl(JSON.stringify($.config,null,2));
  },
  
  sqlid:function(){
    var spath = $.path.join(__dirname,'sqlid.js'); 
    app.sqlid.define(require(spath));
    //cl($.lib.sqlid);
    app.sqlid.get('techo',{hello:'world'},cl);
  },
  
  render: function(page='index'){
    app.render(page,{},cl);  
  },
  
  start: app.start,
  stop: app.stop,
  
  startStop: function(ms=5000){
    cl(app.start());
    setTimeout(function(){
      cl(app.stop());
      $.lib.fn.x('quitting...')
    },ms)
  },

  timed: function(){
    test.config();
    var ttest = function(){
      cl('Timer Done.');
      process.exit();
    } 
    
    app.timed.define(ttest);
    app.start();
    
  }
    
}

//test.view()
//test.render();
//test.startStop(2000)
//test.config();
//test.sqlid();
//test.lib();
//test.api();
test.start();
//test.timed();
//test.pho();
//test.backup();

/*
$.lib.fn.jsonPut($.path.join(__dirname,'config.json'),{
  APP:{
    XX:123
  }
},cl)
$.lib.fn.jsonGet($.path.join(__dirname,'config.json'),cl)
*/
