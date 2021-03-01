var User = require('../models/user');
var Post = require('../models/post');
var PostType = require('../models/posttype');
var cloudinary = require('../config/cloudinaryConfig');
var bcrypt = require('bcrypt');



// Display some User's profile
exports.user_profile = function(req, res) {
    User.findOne({ _id: req.params.userId })
    .then(function (user) {
      Post.countDocuments({ author: user._id })
      .then(function (count) {
        PostType.find({}).exec(function(err, types) {
          if(err) {
            console.log(err);
          }

          res.render('profile', { title: user.fullname, loginSelected: true, user: user, report_count: count, postTypes: types });
        })
      })
    })
    .catch(function (e) {
      console.log(e.message);
    });
};

// Display edit profile form on GET.
exports.user_profileEdit_get = function(req, res) {
    User.findOne({ _id: req.session.user })
    .then(function(user) {
      res.render('profileEdit', { title: 'Редактировать профиль', loginSelected: true, user: user });
    })
    .catch(function (e) {
      console.log(e);
    })
};

// Handle profile editing on POST.
exports.user_profileEdit_post = function(req, res) {
  req.updated =  {
    fname: req.body.fname,
    sname: req.body.sname,
    bio: req.body.bio
  }
  if(req.body.newpass == req.body.rnewpass) {
    User.findOne({ _id: req.body.userid }).select('password')
    .then(function (user) {
      bcrypt.compare(req.body.currpass, user.password, function(err, result) {
        if(err) {
          console.log(err.message);
        }

        if(result) {
          bcrypt.hash(req.body.newpass, 10, function(err, passHash) {
            if(err) {
              console.log(err.message);
            }
            req.updated.pass = passHash;
          });
        }
      });
    })
    .then(function () {
      return new Promise(function(resolve, reject) {
        if(req.files[0].mimetype.indexOf('image') !== -1) {
          if(req.files[0].size > 52428800) {
            req.params.userId = req.body.userid;
            res.locals.errorMsg = 'Максимальный объем изображения 50 МБ';
            user_profileEdit_get(req, res);
            reject();
          } else {
            cloudinary.uploader.upload(req.files[0].path,
              { folder: 'image' },
              function(err, result) {
                if(err) { reject(error) }
                resolve(result.secure_url);
              });
          }
        }
      })
    })
    .then(function (photo) {
      if(photo) {
        req.updated.photo = photo;
      }
      return User.updateOne({ _id: req.body.userid }, req.updated, { new: true });
    })
    .then(function (user) {
      res.redirect('/users/profile?edit=1');
    })
    .catch(function (e) {
      console.log(e.message);
    });
  }

};
