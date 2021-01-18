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
  //cl(data);
  
  var args = [];for(var key in data){
    if(key[0] != '_') args.push(`${key}=${data[key]}`);
  }
  
  $('#modal-report object').attr('data',`pho/${data._format}/${data._conid}/${data._fname}?${args.join('&')}`);
  $('#modal-report').modal('show');

}

function report(e){
  const me = $(this);
  const id = me.attr('data-id');
  if(!(id in pagedata.menus.reports.children)) return;
  
  var report = pagedata.menus.reports.children[id].report;
  report.inputs.push(
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
        {value:'pdf',text:'PDF View'},
        {value:'excel',text:'Excel Download'},
        {value:'html',text:'HTML View'},
      ]
    }
  );
  
  dynadd('#modal-repopt .modal-body form',report.inputs);
  $('#modal-repopt').modal('show');
}

function dynadd(tgt='body',data){

  data = data || [
    {type:'combo',name:'testc',text:'Test Combo',data:[
      {value:'1',text:'one'}  
    ]},
    {type:'number',name:'testi',text:'Test Input'},
  ]
  
  const top = $(tgt); 
  var wrap = top.find('div.dyn-wrap').first();
  if(wrap.length==0) {
    wrap = $('<div class="dyn-wrap"/>');
    wrap.appendTo(top);
  }
  
  wrap.empty();
  
  data.map(function(item){
    
    if(item.type=='hidden') {
      var input = $('<input />');
      input.attr(item);
      input.appendTo(wrap);
      return;
    }
    
    item.required = item.required || true;
    const div = $('<div class="dyn-group form-group" />');
    wrap.append(div);
    
    const label   = $('<label class="dyn-label form-control-label" />');
    label.text(item.text).appendTo(div);
    delete(item.text);
    
    if(item.type=='combo') {
      var data; if(item.data) data = item.data;
      delete item.data;
      var input = $('<select class="dyn-combo form-control form-control-sm bs-combo" />');
      input.combo(item);
      if(data) input.combo('load',data);
    } else {
      var input = $('<input class="dyn-input form-control form-control-sm bs-combo" />');
      input.attr(item); 
    }
    
    input.appendTo(div);
    
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
    
    if(location.pathname != '/' && location.pathname != '/logout') setCookie('lastPage',location.pathname);
    //history.replaceState({}, null, "/");
    
    inactive();
    $('#report_go').click(report_go);
    $('a[data-id]')
      //.data('xx',pagedata.menus.reports.children[$(this).attr('data-report')])
      .click(report)
    
  });