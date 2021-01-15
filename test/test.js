app = require('../');
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
    app.define.view($.path.join(__dirname,'views'));
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
    app.define.lib('test',$.path.join(__dirname,'sqlid.js'));
    $.lib.test.techo.get({hello:'world'},cl);  
  },
  
  configDefine: function(){
    app.define.config($.path.join(__dirname,'config.json'));
    cl(JSON.stringify($.config,null,2));
  },

  configSet: function(){
    test.configDefine();
    cl(app.put.config({'APP':{"title":args[0] || 'xxx'}}));
    cl(app.get.config('APP'));
  },
  
  sqlid:function(){
    var spath = $.path.join(__dirname,'sqlid.js'); 
    app.define.sqlid(require(spath));
    //cl($.lib.sqlid);
    app.get.sqlid('techo',{hello:'world'},cl);
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
    },ms);
  },

  timed: function(){
    test.configSet();
    var ttest = function(){
      cl('Timer Done.');
      process.exit();
    } 
    
    app.define.timed(ttest);
    app.start();
    
  }
    
}

// command line args
const args = process.argv.slice(2).filter(function(e){return e});

if(1==2){
  test.view()
  test.render();
  //
  test.configDefine();
  test.sqlid();
  test.lib();
  test.api();
  //test.start();
  test.timed();
  test.pho();
  test.backup();
  test.configSet();
}

test.start();

