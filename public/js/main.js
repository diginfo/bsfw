function today(){
  var d = new Date();
  return `${d.getFullYear()}-${d.getMonth().toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
}

function setCookie(key, value) {
  var expires = new Date();
  expires.setTime(expires.getTime() + (value * 24 * 60 * 60 * 1000));
  document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
}

function getCookie(key) {
  var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
  return keyValue ? keyValue[2] : null;
}

function deletes(arr){
  arr.map(function(a){
    delete(a);  
  })  
}

function report_go(){
  var form = $('#modal-repopt .modal-body form');
  var valid = form.form('validate'); 
  var data = form.form('getData');
  var modal = $('#modal-repopt');
  if(!valid) return;
  
  modal.modal('hide')
  
  var args = [];for(var key in data){
    if(key[0] != '_') args.push(`${key}=${data[key]}`);
  }
  
  var body = $('#modal-report .modal-body');
  body.find('object').remove();
  var dob = $('<object type="application/pdf" width="100%" height="500" style="height: 85vh;" />');
  var url = `pho/${data._format}/${data._conid}/${data._fname}?${args.join('&')}`;
  cl(url);
  dob.appendTo(body);
  dob.attr('data',url);
  $('#modal-report').modal('show');

}

function clone(obj){
  return JSON.parse(JSON.stringify(obj));  
}

function report(e){
  const me = $(this);
  const id = me.attr('data-id');
  if(!(id in pagedata.menus.reports.children)) return;
  
  var report = clone(pagedata.menus.reports.children[id].report);
  report.inputs = report.inputs || [];
  report.inputs.push (
    {
      type  : 'hidden',
      name  : '_fname',
      value : report.fname, 
    },

    {
      type  : 'hidden',
      name  : '_conid',
      value : report.conid.toLowerCase(), 
    },
    
    {
      type:'combo','text':'Format',name:'_format',data:[
        {value:'pdf',text:'PDF View',selected:true},
        {value:'excel',text:'Excel Download'},
        {value:'html',text:'HTML View'},
      ]
    }
  );
  
  dynadd('#modal-repopt .modal-body form.bs-form',report.inputs);
  $('#modal-repopt').modal('show');
}

function dynadd(tgt='body',data){
  
  /*
  data = data || [
    {type:'combo',name:'testc',text:'Test Combo',data:[
      {value:'1',text:'one'}  
    ]},
    {type:'number',name:'testi',text:'Test Input'},
  ]
  */
  tgt = $(tgt);
  tgt.empty();
  
  data.map(function(item){
  
    var cls = item.class;
    delete(item.class);
    
    if(item.type=='hidden') {
      var input = $('<input />');
      input.attr(item);
      input.appendTo(tgt);
      return;
    }
    
    var required = item.required || true;
    delete(item.required);
    const div = $('<div class="dyn-group form-group" />');
    tgt.append(div);
    
    const label   = $('<label class="dyn-label form-control-label" />');
    label.text(item.text).appendTo(div);
    delete(item.text);
    
    if(item.type=='combo') {
      var data; if(item.data) data = item.data;
      delete item.data;
      var input = $('<select class="dyn-combo form-control form-control-sm bs-combo" data-validate="true" />');
      input.combo(item);
      if(data) input.combo('load',data);
    } else {
      var input = $('<input class="dyn-input form-control form-control-sm bs-combo" data-validate="true" />');
      input.attr(item); 
    }
    
    input.addClass(cls).appendTo(div);
    input.prop('required',required);
    
  })
}

var inactive = function () {
  window.timer = '';
  window.onload = timerReset;
  document.onkeypress = timerReset;
  document.onmousemove = timerReset;
  document.onmousedown = timerReset; 
  document.ontouchstart = timerReset;
  document.onclick = timerReset;
  document.onscroll = timerReset;
  document.onkeypress = timerReset;

  function timerElapsed() {
    //console.log("Timer elapsed");
    location.reload();
  };

  function timerReset() {
    //console.log("Reseting timer");
    clearTimeout(timer);
    timer = setTimeout(timerElapsed, 15 * 60 * 1000);
  }
};

$(document)

  //var lastPage = ( $.cookie("lastPage") == null ) ? "index" : $.cookie("lastPage");
  //location.href = lastPage;

  .on('keyup','input[type="date"]', function(e) {
    e.preventDefault();
    if(e.keyCode==84) $(this).val(today());
  })
  
  .on('keyup','input.upper', function(e) {$(this).val( $(this).val().toLocaleUpperCase())})
  .on('click','.gridbuts button',function(){
    const mode = $(this).attr('mode');
    cl(mode);
    //form.form(mode);
  })

  .ready(function() {
    // initialise widgets
    $('.bs-combo').combo();
    $('.bs-input').input();
    $('.bs-form').form();
    $('.bs-button').button();
  
    $(`nav .nav-item a[href$="${location.pathname}"]`).addClass('active');
    
    if(location.pathname != '/logout') setCookie('lastPage',location.pathname);
    //history.replaceState({}, null, "/");
    
    inactive();
    $('#report_go').click(report_go);
    $('a[data-id]')
      //.data('xx',pagedata.menus.reports.children[$(this).attr('data-report')])
      .click(report)
    
  });