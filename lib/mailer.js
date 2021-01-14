const nodemailer  = require('nodemailer');
const async = $.async;

// Mailer Options
const em = $.config.MAIL;
const conf = {
  host      : em.SMTP_SVR,
  port      : em.SMTP_PORT,
  auth: {
    user    : em.UID,
    pass    : em.PWD ,
  },

  tls: {
    ciphers: 'SSLv3'
  }
};

module.exports = {
  delayms : em.DELAY_MS || 100,
  send    : send
}

const mex = module.exports;

mex.tests = {
  send:function() {
    send([
      {
        to      : 'noreply@peter-c.net',
        subject : 'new subject 1',
        html    : '<h4>Hello World</h4>'  
      },
      
      {
        to      : 'noreply@peter-c.net',
        subject : 'new subject 2',
        html    : '<h2>Subject 2 Body</h2>'  
      },
      
      {
        to      : 'noreply@peter-c.net',
        subject : 'new subject 3',
        html    : '<h2>Subject 3 Body</h2>'  
      }
    ])
  }  
}

// requires [{to,html/body,subject}]
function send(mails,cb=cl){
  mails = $.lib.fn.asArray(mails);
  
  try {
    var transport = nodemailer.createTransport(conf);
  } catch(err){
    ce(err.message);
    return cb({error:true,msg:err.message});
  }
  
  var infos = [], first;
  async.eachSeries(mails,function(mail,next) {
    
    // default to account userid
    if(mail.from && (mail.from != conf.auth.user)) ce(`cannot send from: ${mail.from}.`);
    mail.from = conf.auth.user; 
    
    // set noreply - some providers (outlook.sg) do not allow this
    if(mail.noreply) mail.replyTo = conf.auth.user.replace(/.*@/,'noreply@'); 
    
    mail.error = false;
    if(mail.debug) cl('msg:',mail);
    
    // blind copy
    //mail.bcc = $.config.MAIL.bcc || null;
    
    // dont use a delay on first message
    if(!first) var tout = 0;
    else var tout = module.exports.delayms;
    first = true; 
    
    // prevent hammering of mail server.
    setTimeout(async function(){
      try {
        mail.info = await transport.sendMail(mail);
      } catch(err){
        ce(err.message);
        mail.info = err;
        mail.error = true;
      } finally {
        infos.push(mail);
        next();  
      }
    },tout);
       
  },function(){
    cb(infos);
  }); 
}

// CLS mailer function
/*
async function mailer(arr,lcb){
  
    var mailSetting = {
          host: arr.host, //'smtp-mail.outlook.com',
          port:arr.port,  //587,
          auth: {
              user: arr.user,
              pass: arr.pass
          },
          tls: {
              ciphers: 'SSLv3'
          }
    };
    if (config.MAIL.SMTP_AUTH == 0 ) delete mailSetting.auth;
    try {
      var transporter = nodemailer.createTransport(mailSetting);
    }
    catch(error){
      return lcb({error:true,msg:"TRANSPORT ERROR MESSAGE: " + error.message});
    }
    var mailOptions = {
        from: arr.user,
        to:arr.to,
        subject: arr.subject,
        html:arr.html
    }
    try{
       let info =await transporter.sendMail(mailOptions);  
      if (info.messageId)return lcb({error:false,msg:`Message sent. Message Id: ${info.messageId}`});
    }
    catch(error1) {
      return lcb({error:true,msg:"SENDING ERROR MESSAGE: " + error1.message});
    }
}
*/
