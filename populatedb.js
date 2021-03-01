var async = require('async')

var PostType = require('./models/posttype')
var Token = require('./models/token')
var User = require('./models/user')
var Post = require('./models/post')
var Comment = require('./models/comment')
var Like = require('./models/like')

var mongoose = require('mongoose');
var mongoDB = 'mongodb+srv://adm:zsJFwdUDctU2l4tA@csp-cluster-lnzxf.azure.mongodb.net/csp-db?retryWrites=true&w=majority';
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

console.log('run');
function createTest(model, obj, options) {
  if(options) {
    model.create(obj, options, function (err) {
      if (err) console.log(err.message);
    });
  } else  {
    model.create(obj, function (err) {
      if (err) console.log(err.message);
    });
  }
}


createTest(PostType, { type: 'ДТП', icon: 'https://res.cloudinary.com/dedk0myxj/image/upload/v1582877157/icon/types/car-accident_pzyooa.png' });

createTest(PostType, { type: 'Неубранный мусор', icon: 'https://res.cloudinary.com/dedk0myxj/image/upload/v1582882234/icon/types/garbage_ij7m8c.png' });

createTest(PostType, { type: 'Загрязнение окружающей среды', icon: 'https://res.cloudinary.com/dedk0myxj/image/upload/v1582882234/icon/types/pollution_rm1dvc.png' });

createTest(PostType, { type: 'Проблема ЖКХ', icon: 'https://res.cloudinary.com/dedk0myxj/image/upload/v1582883099/icon/types/housing-service_yszbb1.png' });

createTest(PostType, { type: 'Мошенничество', icon: 'https://res.cloudinary.com/dedk0myxj/image/upload/v1582882234/icon/types/fraud_idqxk6.png' });

createTest(PostType, { type: 'Иная проблема', icon: 'https://res.cloudinary.com/dedk0myxj/image/upload/v1582882234/icon/types/other_yoavet.png' });
