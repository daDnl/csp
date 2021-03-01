var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var helmet = require('helmet');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var postsRouter = require('./routes/posts');
var authRouter = require('./routes/auth');

var app = express();

app.disable('x-powered-by');

//Set up mongoose connection
var mongoose = require('mongoose');
var mongoDB = 'mongodb+srv://adm:tRZ7Zm3RE5g4z.T@csp-cluster-lnzxf.azure.mongodb.net/csp-db?retryWrites=true&w=majority';
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// view engine setup
var hbs = require('hbs');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser('dsadA%D%ad6sadt728Ds8dsd77asdiu8*&6as00'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());
app.use(session({
    saveUninitialized: true,
    resave: false,
    cookie: {
        secure: false,
        httpOnly: false,
        domain: 'localhost',
        key: 'usr',
        maxAge: 1209600000 // 14 days
    },
    name: 'currentUser',
    secret: 'dsadA%D%ad6sadt728Ds8dsd77asdiu8*&6as00',
    store: new MongoStore({ mongooseConnection: db, ttl: 1209600 })
}));
app.use(function(req,res,next) {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', 'localhost');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if(req.session.priv == 'common') {
      res.locals.authed = true;
    } else if(req.session.priv == 'moderator' || req.session.priv == 'admin') {
      res.locals.authed = true;
      res.locals.admin = true;
    }

    if(req.query.login) {
      res.locals.loginVisible = true;
    }

    next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/posts', postsRouter);
app.use('/auth', authRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
