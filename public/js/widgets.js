cl = console.log;
const bs = {
  
  maps: {
    icons: {
      delete  : 'trash',
      add     : 'plus',
      cancel  : 'undo',
      save    : 'save',
      edit    : 'edit',
    },
    
    colors: {
      'green'   : 'success', 
      'red'     : 'danger',
      'blue'    : 'primary',
      'grey'    : 'secondary',
      'yellow'  : 'warning',
      'cyan'    : 'alert',
      'white'   : 'light',
      'black'   : 'dark', 
    }
  },

  getKeyVal:function(arr,val,key='value'){
    return arr.filter(o => {
      return o[key] === val
    })[0];
  },

  str2obj:function(str){
    try{return eval('[{'+str+'}]')[0]}
    catch(err){return str};
  },

  getAttr: function(el){
    var atr = {};
    Array.prototype.forEach.call(el[0].attributes, function(attr){
      atr[attr.name] = attr.value;
    })
    return atr;  
  },

  loadOptions: function(el,data){
    data = data || [];
    el.empty();
    el.append($(`<option value="" disabled selected>Select One</option>`))
    data.map(function(item){
      el.append($(`<option value=${item.value}>${item.text}</option>`))
    });        
  },

  dataOptions: function(that){
    that.options = $.extend(
      that.options,
      bs.getAttr(that.element),
      bs.str2obj(that.element.data('options'))
    );
    
    that.element.removeAttr('data-options');
  },

  cloneAttr:function(src,tgt){
    var att = src.prop("attributes");
    $.each(att, function() {
        tgt.attr(this.name, this.value);
    });
  }, 

  ajaxGet:function(url,qp,cb){
    $('body').addClass('lock');
    var ajto;
    $.get(url,qp,function(res) {
      clearTimeout(ajto);
      setTimeout(function(){
        $('body').removeClass('lock');  
        if(res.error || res.alert) alert(res.msg);
        if(cb) return cb(res);
      },500);
    });
    
    ajto = setTimeout(function(){
      $('body').removeClass('lock');
      alert('Bad response from server.')  
    },5000);    
  },

  changeTag:function(originTag, destTag) {
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
  },

  me: function(){
    return {
      self  : this,
      opt   : this.options,
      el    : this.element,
      attr  : this.element.attr,
      name  : this.element.attr('name'),
      id    : this.element.attr('id'),
    } 
  },

}

$.widget("bs.button",{
  
  options : {
    text        : 'button',
    init        : false,
    icon        : '',
    mode        : 'put',
    color       : 'blue',
    init        : false,
    onClick     : function(){
      
    }
  },

  __create:function(){
    const me = this;
    const el = me.element;
    var but = $(`<button type="button" />`);
  },

  _init: function(){
    const me = this;
    const el = me.element;
    const opt = me.options;

    if(opt.init) return;
    opt.init = true;
    
    // use element data-options="xxx:'yyy'" if set
    me.options = Object.assign(opt,bs.str2obj(el.attr('data-options')));
    
    el
      .addClass(`btn bs-button btn-${bs.maps.colors[opt.color]}`)
      /*.text(opt.text)*/
      .on('click',function(){opt.onClick()})
      .append(`<i class="fa fa-${opt.icon||''}"></i> ${opt.text}`)
  },
  
})

$.widget("bs.form",{
  
  options : {
    qp          : {},
    url         : '/api',
    sqlid       : null,
    fkey        : null,
    mode        : 'load',
    type        : 'multi',
    init        : false,
    mode        : 'put',
    buttons     : [], /* ['add','save','delete','cancel'] */

    onBeforeSubmit: function(mode,data){
      cl('onBeforeSubmit');
      return true     
    },    
    
    onSubmit: function(mode,data){
      return this.onSubmit(mode,data); 
    },
    
    onBeforeLoad : function(){
      return true;
    },
    
    onLoad: function(){
      return true
    },

    onLoadSuccess: function(){
      
    },

    onSave: function(){
      return true
    },    

    onDelete: function(){
      return true
    },

    onAdd: function(){
      return true
    },

    onCancel: function(){
      return true
    },
  
  },

  addButtons: function(){
    const me = this;
    const form = me.element;
    var opt = me.options;
    
    const butfunc = {
      add       : {
        type    : 'button',
        icon    : bs.maps.icons['add'],
        text    : 'Add',
        color   : 'blue',
        mode    : 'add',
        onClick : function(){me.add()}
      },
      
      save      : {
        type    : 'submit',
        icon    : bs.maps.icons['save'],
        text    : 'Save',
        color   : 'green',
        mode    : 'save'        
      },
      
      delete    : {
        type    : 'button',
        icon    : bs.maps.icons['delete'],
        text    : 'Delete',
        color   : 'red',
        mode    : 'delete',
        onClick : function(){me.delete()}         
      },
      
      cancel    : {
        type    : 'button',
        icon    : bs.maps.icons['cancel'],
        text    : 'Cancel',
        color   : 'yellow',
        mode    : 'cancel',
        onClick : function(){
          if(opt.onCancel) location.reload();
        }          
      }
    }    
    
    if(opt.buttons.length==0) return;
    var div = $('<div class="formbuts" />'); 
    form.append(div);
    
    opt.buttons.map(function(but){
      var data = butfunc[but];
      var but = $(`<button class="btn-sm" data-mode="${data.mode}" type="${data.type}"/>`);
      but.button(data)
      but.appendTo(div);
    })    
    
  },

  _create:function(){
    const me = this;
    const el = me.element;
    el.addClass('bs-form needs-validation')
    el.attr('novalidate',true);

    el.on('submit',function(e){
      e.preventDefault();
      e.stopPropagation();
      var target = e.explicitOriginalTarget || e.relatedTarget || document.activeElement || {};
      var mode = $(target).data('mode');
      var data = me.getData(); 
      cl('submit',mode);
      if(mode) {
        if(mode == 'save' && !me.options.onBeforeSubmit(mode,data)) return;
        else me[mode]();
      }  
    })

  },

  _init: function(){
    const me = this;
    const form = me.element;
    var opt = me.options;
    
    //cl('form-init')
    if(opt.init) return;
    opt.init = true;

    // use element data-options="xxx:'yyy'" if set
    //opt = Object.assign(opt,bs.str2obj(form.attr('data-options')));
    bs.dataOptions(this);
  
    me.addButtons();
    
    form.trigger('reset');

    if(opt.type == 'single' && opt.sqlid) {
      //bs.ajaxGet(`ajax/${opt.sqlid}_get`,{},function(data) {
      bs.ajaxGet(`${opt.url}/get/${opt.sqlid}`,{},function(data) {
        me.load(data);    
      })
    }
    
    else if(opt.type=='multi'){
      const sel = form.find(`select[name="${opt.fkey}"]`);
      sel.combo({
        onSelect:function(rec){
          var args = {};
          args[opt.fkey] = rec.value;            
          bs.ajaxGet(`${opt.url}/get/${opt.sqlid}`,args,function(data) {
            me.load(data);
          });            
        }
      });
    }
    
  },

  validate: function(){
    var valid = this.element[0].checkValidity();
    if(!valid) this.element.removeClass('needs-validation').addClass('was-validated');
    else this.element.addClass('needs-validation').removeClass('was-validated');
    return valid;  
  },

  add:function(){
    const form = this.element;
    const opt = this.options;
    if(!opt.onAdd()) return;
    this.reset();
    var input = $(`<input name="${opt.fkey}" class="form-control bs-input upper" type="text" />`); 
    $(`select[name="${opt.fkey}"]`).replaceWith(input);
    input.focus();
  },

  reset:function(){
    const opt = this.options;
    const form = this.element;
    form.find(`input, textarea, select`).not(`select[name="${opt.fkey}"]`).val('');
  },

  clear:function(){
    this.reset();
  },
  
  load: function(data){
    const opt = this.options;
    if(!opt.onBeforeLoad(data)) return;
    const form = this.element;
    this.reset();
    function go(data){
      for(var item in data){
        if(item != opt.fkey) {
          form.find(`*[name="${item}"]`).val(data[item] || '');
        } 
      }
    }    
    
    if(!data && opt.sqlid && opt.url){
      var data = {};
      data[opt.fkey] = form.find(`select[name="${opt.fkey}"]`).val();
      if(opt.fkey && !data[opt.fkey]) return alert('Key field cannot be null.')
      bs.ajaxGet(`${opt.url}/get/${opt.sqlid}`,data,go);
    }
    
    else if(data) go(data);
    else go([]);
    
    opt.onLoad(data);
    
    
  },

  getData: function(){
    var data = {};
    var form = this.element;
    form.serializeArray().map(function(item){
      data[item.name] = item.value || '';  
    })    
    return data;
  },
  
  save: function(){
    var valid = this.validate();
    if(!valid) return;
    var data = {};
    var form = this.element;
    const opt = this.options; 
    form.serializeArray().map(function(item){
      data[item.name] = item.value || '';  
    })
    if(!opt.onSave()) return;
    if(opt.fkey && !data[opt.fkey]) return alert(`Key field cannot be null.`)
    bs.ajaxGet(`${opt.url}/put/${opt.sqlid}`,data);
  },
  
  delete: function(){
    var data = {};
    var form = this.element;
    const opt = this.options; 
    data[opt.fkey] = form.find(`select[name="${opt.fkey}"]`).val();
    if(!opt.onDelete()) return;
    if(opt.fkey && !data[opt.fkey]) return alert('Key field cannot be null.')
    bs.ajaxGet(`${opt.url}/del/${opt.sqlid}`,data,function(){
      location.reload();
    });
  },  
  
  
})

$.widget("bs.input",{
  
  options :{
    qp          : {},
    url         : '/api',
    sqlid       : null,
  
  },

  _create:function(){
    const me = this;
    const el = me.element;
    el.addClass('bs-input')
  },

  _init: function(){
    const me = this;
    const el = me.element;
    //cl('input-init')  
  }
  
})

$.widget("bs.combo",{
  
  me: bs.me,
  
  options :{
    qp          : {},
    url         : '/api',
    sqlid       : null,
    data        : [],

    onBeforeLoad: function(qp){
      return true;
    },
    
    onSelect: function(rec){
      //cl('onSelect:',rec);  
    },

    onLoadSuccess: function(data){
      // cl('onLoadSuccess:',data);  
    },

    loadFilter: function(data){
      return data;  
    },
    
    _init        : false,
  },

  getOptions: function(){
    return this.options;    
  },

  setOptions: function(arg){
    cl(arg);
    this.options = Object.assign(this.options,arg);    
  },

  loadUrl: function(){
    const me = this.me();
    if(me.opt.sqlid && me.opt.url){        
      if(me.opt.onBeforeLoad(me.opt.qp)===false) return;
      bs.ajaxGet(`${me.opt.url}/get/${me.opt.sqlid}`,me.opt.qp,function (data) {
        if(!data.error) me.self.load(data);
      });
    }
  },

  load : function(data){
    const me = this.me();  
    //cl('load:',opt.name,data)
    
    data = data || [];
    me.opt.data = data;
    
    // filter the data
    data = me.opt.loadFilter(data);
    me.el.empty();
    me.el.append($(`<option disabled selected value="">Select</option>`))
    data.map(function(item){
      me.el.append($(`<option value=${item.value}>${item.text}</option>`))
    });
    me.opt.onLoadSuccess(data);
  },

  loadData: function(src){
    if(src && typeof(src)=='object') this.load(src);
    else this.loadUrl();         
  },

  getData: function(){
    return this.options.data;    
  },
  
  getRec: function(){
    const me = this.me();
    var rec = bs.getKeyVal(me.opt.data,me.el.val()); 
    return rec || {};    
  },
  
  getValue: function(){
    return this.getRec().value || null; 
  },

  getText: function(){
    return this.getRec().text || null; 
  },

  select: function(val){
    const me = this.me();
    var rec = bs.getKeyVal(me.opt.data,val);
    me.el.val(rec.value).change();
  },
  
  _create:function(){
    const me = this.me();
    bs.dataOptions(me.self);
    me.el.addClass('form-control form-control-sm bs-combo');
    me.el.prop('required',me.opt.required);
    me.el.attr({
      name  : me.opt.name,
      id    : me.opt.id
    })

    /*
      options that are loaded using using mixin ???  
      
    */

    // load options added using html.
    /*
    $(me.el).find('option').each(function(idx){
      if($(this).val()) me.opt.data.push({text:$(this).text(),value:$(this).val()})
    });
    */

  },
  
  _init: function(evt){
    const me = this.me();
    if(me.opt._init) return;
    me.opt._init = true;
    me.el.on('change',function(e){
      e.preventDefault();
      me.opt.onSelect(me.self.getRec());
    });
    
    var data = null;
    if(me.opt.data.length > 0) data = me.opt.data;
    me.self.loadData(data); 
  },
    
})

$.widget("bs.popmodal",{
  
  options :{
    id      : '',
    title   : 'Popup',
    
    _buttons : [
      {
        color: 'green',
        text:'Save',
        onClick:function(){}
      },
      {
        color: 'yellow',
        text:'Cancel',
        onClick:function(){}
      },
    ],

    buttons: false,
    
    onSave: function(){
      cl('onSave')  
    },
    
    onShow: function(jq){
      //cl(jq)  
    },

    onHide: function(jq){
      //cl(jq);  
    },
    
    init: false,
      
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
    bs.dataOptions(this);
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
    
    if(this.options.buttons){
      this._foot = $('<div class="modal-footer" />');
      this._quit = $('<button class="button btn btn-secondary" type="button" data-dismiss="modal">Cancel</button>');
      this._save = $('<button class="btn btn-primary" type="button" data-dismiss="modal">Save</button>');
      this._save.on('click',function(){me.options.onSave()})
      this._quit.appendTo(this._foot);
      this._save.appendTo(this._foot);
      this._foot.appendTo(this._content);
    }
    
  },
  
  _init: function(){

    const opt = this.options;
    //cl('modal-init');
    if(opt.init) return;
    opt.init = true;

    this.element.modal('hide');
    this.setTitle();
  }
  
})

$.widget("bs.dgrid",{
  
  options: {
    height      : 'auto',
    qp          : {},
    url         : '/api',
    sqlid       : null,
    data        : {},
    columns     : [],
    editable    : true,
    editrow     : null,
    key         : null,
    init        : false,
    title       : 'Datagrid',
    fixed       : false,        /* fixed width columns */
    
    pager       : {
      page      : 1,
      size      : 25,
      pages     : 1  
    },
    
    buttons     : ['add','delete','edit'],
    
    onBeforeAdd: function(idx,row){
         
    },

    onEditStart: function(idx,row){
    
    },

    onEditEnd: function(idx,row){
    
    },

    onClick: function(idx,row){
    
    },

    onBeforeLoad: function(qp){
      return qp;
    },

    onLoadSuccess: function(data){
    
    },
  
  },

  addButtons: function(){
    const me = this;
    const el = me.element;
    const opt = me.options;
    
    // add buttons
    const butfunc = {
      add       : {
        text    : 'Add',
        icon    : bs.maps.icons['add'],
        color   : 'blue',
        onClick : function(){me.addRow()}
      },
      
      delete    : {
        text    : 'Delete',
        icon    : bs.maps.icons['delete'],
        color   : 'red',
        onClick : function(){
          var data = me.getSelected();
          if(data.idx > -1) me.deleteRow(data.idx);
        }         
      },
      
      edit    : {
        text    : 'Edit',
        icon    : bs.maps.icons['edit'],
        color   : 'yellow',
        onClick : function(){
          var data = me.getSelected();
          if(data.idx > -1) me.editRow(data.idx,data.row);
        }          
      }
    }    
    
    var div = $('<div class="gridbuts" />'); 
    div.insertAfter(el)
    
    opt.buttons.map(function(but){
      var data = butfunc[but];
      var but = $(`<button class="btn-sm" mode="${but}" type="button"/>`);
      but.button(data)
      but.appendTo(div);
    })    
  },

  setWidths: function(){
    /*
      1. remove table-fixed
      2. get col widths
      3. apply width styles
      4. add table-fixed 
    */
    
  },

  getOptions: function(){
    return this.options;
  },
  
  setOptions: function(opt){
    opt = opt || {};
    this.options = Object.assign(this.options,opt);
    return this.options; 
  },
  
  getData: function(){
    return this.options.data;
  },

  getRow: function(idx){
    if(this.options.data.rows.length >= idx+1) return this.options.data.rows[idx];
    return {}; 
  },
  
  getRows: function(){
    return this.options.data.rows;
  },

  getColumns: function(){
    return this.options.columns;
  },
  
  addRow: function(data){
    const me = this;
    data = data || {};
    var row = this.getNewRow(data);
    var idx = this.appendRow(row);
    var arg = this.options.onBeforeAdd(idx,row);
    row = Object.assign(row,arg);
    this.editRow(idx,row);
  },

  deleteRow: function(idx){
    const me = this;
    if(idx < 0) return;
    var opt = this.options;
    var row = opt.data.rows[idx];
    data = {};
    data[opt.key] = row[opt.key];
    opt.data.rows.splice(idx, 1);
    
    bs.ajaxGet(`${opt.url}/del/${opt.sqlid}`,data,function (data) {
      me.reload();
    });
  },

  getFields: function(field){
    var fields = {};
    this.options.columns.map(function(col){
      fields[col.field] = col;    
    })  
    if(field) return fields[field];
    return fields
  },
  
  me: bs.me,
  
  getNewRow: function(data){
    var me = this.me();
    data=data||{};
    var row={}, fields = this.getFields();
    for(var key in fields){
      if(data[key]) row[key] = data[key];
      else row[key] = fields[key].default || '';
    }  
    
    return row;
  },

  insertRow: function(row,idx){
    if(idx===undefined) idx = this.getSelected().idx;
    this.options.data.rows.splice(sel.idx,0,row);
    this.load(this.options.data);
  },
  
  appendRow: function(item){
    var idx = this.options.data.rows.push(item)-1;
    this.load(this.options.data);
    return idx;
  },

  selectRow: function(idx){
    this.clearSelected();
    const sel = $('tbody tr').eq(idx);
    sel.addClass('active');
  },

  clearSelected: function(){
    this.element.find('tbody tr').removeClass('active');
  },

  getSelected: function(){
    var sel = this.element.find('tbody tr.active');
    var idx = sel.index();
    return {
      idx: idx,
      row: sel.data()||null
    }
  },
  
  getRowIndex: function(row){
    return this.options.data.rows.indexOf(row);
  },

  updateRow: function(idx,row){
    this.options.data.rows[idx] = Object.assign(this.options.data.rows[idx],row);
    this.reload({
      rows:this.options.data.rows,
      total: this.options.data.rows.length 
    }); 
  },

  reload: function(data){
    if(data) this.load(data);
    else this.load();  
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
        title: `${me.options.title} Row Editor` 
      });
      
      var form = $('<form class="form-line"/>');
    
      me.options.columns.map(function(col){
        if(col.editor){
          var item = $('<div class="form-group"/>');
          var help = $('<div class="help-block with-errors" />');
          var label = $(`<label>${col.title}</label>`);
          var val = row[col.field] || col.default || '';
          col.required = col.required || true;
          
          if(typeof col.editor == 'string'){
            var tag = 'input';
            if(col.editor=='combo') tag = 'select'
            var field = $(`<${tag} data-error="Value is invalid." class="form-control form-control-sm" type="${col.editor}" name="${col.field}" value="${val}" />`);
            var skips=['field','title','editor'];
            var attr={}; 
            for(var key in col){
              if(skips.indexOf(key)==-1) attr[key] = col[key];
            }
            field.attr(attr);
          }
          
          else {
            var tag = 'input';
            col.editor.options = col.editor.options || {};
            col.editor.options.name = col.field;
            if(col.editor.type=='combo') tag = 'select';
            var field = $(`<${tag} />`);
            col.editor.options.value = val;
        
            if(tag=='select') {
            
              field.combo({
                data : col.editor.options.data 
              });
              
              delete(col.editor.options.data);
              setTimeout(function(){field.combo('select',val)});
            }
            
            field.attr(col.editor.options);
            field.addClass('form-control form-control-sm');
            if(tag=='select') {
              
            }
            
          }
          
          item.append(label).append(field).append(help)
          form.append(item);
          //field.trigger('change');
        } else {
          form.append($(`<input type="hidden" name="${col.field}" value="${row[col.field]}" />`));  
        }  
      })
      
      me._modal.popmodal('setBody',form);
      me.options.form = form;
      
      form.form({
        buttons:['save','cancel'],
        onSave: function(){
          var row = {};
          me.options.form.serializeArray().map(function(item){
            row[item.name] = item.value;  
          })
          
          me.updateRow(me.options.editrow,row);
          
          // save the row.
          bs.ajaxGet(`${me.options.url}/put/${me.options.sqlid}`,row,function (data) {
            me.options.editrow = null;
            me._modal.popmodal('hide');
            me.reload();
          });
          
          return false;  
        },
        
        onCancel: function(){
          me._modal.popmodal('hide');
          return false;
        }
      })

    }
    
    // just set the form values.
    else {
      //cl('row',row);
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
        //tr.addClass('clickable-row d-flex');
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
      
      });
      
      opt.onLoadSuccess(data);
    }

    if(src && typeof(src)=='object') go(src);

    else {
      // cl('@@@',opt.onBeforeLoad(opt.qp))
      if(opt.sqlid && opt.url && opt.onBeforeLoad(opt.qp)){        
        bs.ajaxGet(`${opt.url}/get/${opt.sqlid}`,opt.qp,function (data) {
          if(!data.error) go(data);
        });
      }          
    }
  },

  // The constructor
  _create: function() {
    //cl('dgrid-create');
    const el = this.element;
    const opt = this.options;
    
    // wrapper and height
    el.addClass('tablewrap table-sm');
    el.css('height',opt.height);
    
    // use element data-options="xxx:'yyy'" if set
    bs.dataOptions(this);
    
    // append table
    const table = $('<table />');
    opt._table = table;
    table.addClass('table table-hover table-bordered');
    if(opt.striped) table.addClass('table-striped');
    if(opt.fixed) table.addClass('table-fixed'); 
    
    table.appendTo(el);
    
    // create the head
    const head = $('<thead class="thead-dark"/>');
    //const head = $('<thead class="thead-dark d-flex"/>');
    const hrow = $('<tr />');
    head.appendTo(table);
    hrow.appendTo(head);
    opt.columns.map(function(item){
      if(item.width===0) return;
      var th = $(`<th scope="col" field="${item.field}">${item.title}</th>`); 
      if(opt.fixed && item.width) th.css('width',item.width);
      th.appendTo(hrow); 
    })
    
    const body = $('<tbody />');
    body.appendTo(table);
    if(opt.data.rows) this.load(opt.data);
    else this.load(); 
    
  },
  
  _init: function() {
    //cl('dgrid-init');
    bs.dataOptions(this);
    if(this.options.editable) this.addButtons();
  }       
  
})      
  