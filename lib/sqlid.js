const app = module.parent.exports;

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
  echo: {
    get:function(qry,cb){
      cb(qry);
    }
  },

  config: {
    get: function(qry,cb){
      return cb(app.get.config(qry));
    },
  
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
    get: function(qry,cb) {
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
    get:function(qry,cb){
      var arr=[]
      for(var x=1;x<=10;x++){
        arr.push({value:x,text:x})
      }
      cb(arr)
    }
  }

}
