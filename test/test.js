app = require('../');
module.exports.app = app;

var test = {
  backup: function(){
    app.lib.user.backup();  
    app.lib.user.restore(cl);
    cl(app.sstore.sessions)
  },

  pho: function(){
    app.path.prpt.push(app.mod.path.join(__dirname,'./prpt'))
    
    var res = {
      setHeader : function(x,y){cl(x,y)},
      end       : function(x,y){cl(x,y)},
      write     : function(x,y){cl(x.toString())},
    };
    
    var req = {
      // http://mydev.puremfg.net:8008/pho/pdf/vmfg/ms_inv_part?testc=1&testi=11
      path  : '/pho/html/vmfg/ms_inv_part',
      query : {
        base_id     : 'WLH-0000219',
        START_BASE  : 'WLH-0000219',
        END_BASE    : 'WLH-0000219',
      }
    } 
    
    app.lib.pho.get(req,res,function(err){
      cl(err)
    });
  },
  
  view: function(){
    app.define.view(app.mod.path.join(__dirname,'views'));
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
    app.define.lib('test',app.mod.path.join(__dirname,'sqlid.js'));
    app.lib.test.techo.get({hello:'world'},cl);  
  },
  
  configDefine: function(){
    app.define.config(app.mod.path.join(__dirname,'config.json'));
    cl(JSON.stringify(app.config,null,2));
  },

  configSet: function(){
    test.configDefine();
    cl(app.put.config({'APP':{"title":args[0] || 'xxx'}}));
    cl(app.get.config('APP'));
  },
  
  sqlid:function(){
    var spath = app.mod.path.join(__dirname,'sqlid.js'); 
    app.define.sqlid(require(spath));
    //cl(app.lib.sqlid);
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
      //app.lib.fn.x('quitting...')
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

/*
app.express.get('/pho',function(req,res,next){
  cl('xxxx');
  app.lib.pho.get(req,res,function(err){
    
  });    
})
*/

//test.sqlid();
test.start();
//test.pho();
//test.startStop();

//app.get.sqlid()

