cl = console.log;

function ajaxGet(url,qp,cb){
  $.get(url,qp,function(res) {
    if(res.error) alert(res.msg);
    if(cb) return cb(res);
  });    
}

function cloneAttr(src,tgt){
  var att = src.prop("attributes");
  $.each(att, function() {
      tgt.attr(this.name, this.value);
  });
}

function str2obj(str){
  try{return eval('[{'+str+'}]')[0]}
  catch(err){return str};
}
  
function dataOptions(that){
  $.extend(that.options,str2obj(that.element.data('options')),{init:true});
  that.element.removeAttr('data-options');
}

function changeTag(originTag, destTag) {
  while($(originTag).length) {
    $(originTag).replaceWith (function () {
      var attributes = $(this).prop("attributes");
      var $newEl = $(`<${destTag}>`)
      $.each(attributes, function() {
        $newEl.attr(this.name, this.value);
      });  
      return $newEl.html($(this).html())
    })
  }
}

$.widget("dis.popmodal",{
  
  options :{
    id: '',
    title: 'Popup',
    
    onSave: function(){
      cl('save')  
    },
    
    onShow: function(jq){
      //cl(jq)  
    },

    onHide: function(jq){
      //cl(jq);  
    }
      
  },
  
  setTitle:function(title){
    if(title) this.options.title = title;
    this._title.text(this.options.title);   
  },

  setBody:function(html){
    this._body.empty();
    this._body.append(html);  
  },
  
  show: function(){
    this.element.modal('show');
    this.options.onShow(this); 
  },

  hide: function(){
    this.element.modal('hide');
    this.options.onHide(this);  
  },

  _create:function(){
    const me = this;
    this._modal = this.element;
    this._modal.addClass('modal fade').attr({'tabindex':"-1",'role':"dialog",'aria-hidden':"true"});
    this._dlog = $('<div class="modal-dialog" role="document" />');
    this._content = $('<div class="modal-content" />');
    
    this._dlog.appendTo(this._modal);
    this._content.appendTo(this._dlog);
    
    this._head = $('<div class="modal-header" />');
    this._title = $('<h5 class="modal-title" />');
    
    this._close = $('<button class="close" type="button" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>');
    this._head.appendTo(this._content);
    this._title.appendTo(this._head);
    this._close.appendTo(this._head);

    this._body = $('<div class="modal-body" />');
    this._body.appendTo(this._content);
    
    this._foot = $('<div class="modal-footer" />');
    this._quit = $('<button class="button btn btn-secondary" type="button" data-dismiss="modal">Cancel</button>');
    this._save = $('<button class="btn btn-primary" type="button" data-dismiss="modal">Save</button>');
    this._save.on('click',function(){me.options.onSave()})
    
    this._foot.appendTo(this._content);
    this._quit.appendTo(this._foot);
    this._save.appendTo(this._foot);
    
    this.element.modal('hide');
    
    this.setTitle();
    
  },
  
  _init: function(){
    
    
  }
  
})

$.widget("dis.dgrid",{
  
  options: {
    queryParams : {},
    url         : '/ajax',
    sqlid       : null,
    data        : {},
    columns     : [],
    editable    : true,
    editrow     : null,

    onEditStart: function(idx,row){
    },

    onEditEnd: function(idx,row){
    },

    onClick: function(idx,row){
    },
  
  },
  
  getData: function(){
    return this.options.data;
  },

  getRows: function(){
    return this.options.data.rows;
  },
  
  append: function(item){
    this.options.data.rows.push(item);
    this.load(this.options.data);
  },

  selectRow: function(idx){
    this.element.find('tbody tr').removeClass('active');
    const sel = $('tbody tr').eq(idx);
    sel.addClass('active');
  },

  getSelected: function(){
    return this.element.find('tbody tr.active').data() || null; 
  },
  
  getRowIndex: function(row){
    return this.options.data.rows.indexOf(row);
  },

  updateRow: function(idx,row){
    this.options.data.rows[idx] = Object.assign(this.options.data.rows[idx],row);
    this.reload(); 
  },

  reload: function(){
    this.load(this.options.data);  
  },

  editRow: function(idx,row){
    const me = this;
    me._modalid = `${me.element.attr('id')}_editrow`;
    me._modal = $(`#${me._modalid}`);
    
    // not created yet
    if(me._modal.length==0) {
      me._modal = $(`<div id="${me._modalid}"/>`)
      me._modal.appendTo('body');
      me._modal.popmodal({
        title: 'Row Editor',
        onSave: function(){
          var row = {};
          me.options.form.serializeArray().map(function(item){
            row[item.name] = item.value;  
          })
          me.updateRow(me.options.editrow,row);
          me.options.editrow = null;
        }  
      });
      
      var form = $('<form class="form-line" />');
      
      me.options.columns.map(function(col){
        if(col.editor){
          var item = $('<div class="form-group"/>');
          var label = $(`<label>${col.title}</label>`);
          var field = $(`<input class="form-control" type="${col.editor}" name="${col.field}" value="${row[col.field]}" />`);
          item.append(label).append(field);
          form.append(item);
        } else {
          form.append($(`<input type="hidden" name="${col.field}" value="${row[col.field]}" />`));  
        }  
      })
      
      me._modal.popmodal('setBody',form);
      me.options.form = form;
    }
    
    // just set the form values.
    else {
      me.options.columns.map(function(col){
        me.options.form.find(`input[name="${col.field}"]`).val(row[col.field]);    
      });
    }
    
    me.options.editrow = idx;
    me._modal.popmodal('show');
    me.options.onEditStart(idx,row);
  },

  load: function(src){
    var me = this;
    var opt = this.options;
    var el = this.element;
    var table = el.find('table'); 
    var head = el.find('thead');
    var body = el.find('tbody');
    var cols = head.find('tr th[field]');
    
    function go(data){
      body.empty();
      opt.data = data;
      if(!opt.data.rows) opt.data.rows=[];
      opt.data.rows.map(function(row,idx){
        var tr = $('<tr />');
        
        cols.each(function(idx){
          var me = $(this);
          var field = me.attr('field');
          var text = row[field] || '';
          var td = $('<td />');
          if(opt.formatter) td.html(opt.formatter(row)).appendTo(tr);
          else td.text(text).appendTo(tr);
        })

        tr.addClass('clickable-row');
        tr.appendTo(body);
        tr.data(row);
        
        
        
        tr.click(function(e){
          e.preventDefault();
          if(!$(this).hasClass('active')){
            body.find('tr').removeClass('active');
            $(this).addClass('active');          
            //return
          }
          
          if(e.detail==1) return;
          if(opt.editable) me.editRow(idx,row);
          else opt.onClick(idx,row);  
        })
        
        /*
        tr.dblclick(function(e){
          e.preventDefault();
          body.find('tr').removeClass('active');
          $(this).addClass('active');
          opt.onClick(idx,row);  
        })
        */

      });
    }

    if(src && typeof(src)=='object') go(src);

    else {
      if(opt.sqlid && opt.url){        
        ajaxGet(`${opt.url}/${opt.sqlid}`,{},function (data) {
          if(!data.error) go(data);
        });
      }          
    }
  },

  // The constructor
  _create: function() {
    const el = this.element;
    const opt = this.options;
    
    // use element data-options="xxx:'yyy'" if set
    Object.assign(this.options,str2obj(el.attr('data-options')));
    
    // append table
    const table = $('<table />');
    table.addClass('table table-hover');
    if(opt.striped) table.addClass('table-striped'); 
    
    table.appendTo(el);
    
    // create the head
    const head = $('<thead class="thead-dark"/>');
    const hrow = $('<tr />');
    head.appendTo(table);
    hrow.appendTo(head);
    opt.columns.map(function(item){
      $(`<th scope="col" field="${item.field}">${item.title}</th>`).appendTo(hrow); 
    })
    
    const body = $('<tbody />');
    body.appendTo(table);
    if(opt.data.rows) this.load(opt.data);
    else this.load(); 
    
  },
  
  _init: function() {
    cl('init')
    if(this.options.init) return false;
  }       
  
})      
  