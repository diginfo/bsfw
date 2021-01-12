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
    
  });