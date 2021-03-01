var Token = require('../models/token');
var User = require('../models/user');
const { body, validationResult } = require('express-validator');
var cloudinary = require('../config/cloudinaryConfig');
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var nodemailer = require('nodemailer');

// Validation function
exports.validate = function(method) {
  switch (method) {
    case 'register': {
      return [
      body('fname', 'Invalid first name').exists().matches(/[A-zА-я- ]*/i),
      body('sname', 'Invalid second name').optional().isString().matches(/[A-zА-я- ]*/i),
      body('email', 'Invalid email').exists().isEmail(),
      body('pass', 'Invalid password').exists().matches(/^[A-Za-z0-9!@#$%^&*()_+=-`~\\\]\[{}|\';:/.,?><]*$/i),
      body('rpass', 'Invalid password repeat').exists().matches(/^[A-Za-z0-9!@#$%^&*()_+=-`~\\\]\[{}|\';:/.,?><]*$/i),
      body('bio', 'Invalid bio').optional()
      ]
    }
  }
};

// Display registration page on GET
exports.auth_register_get = function(req, res) {
    if(req.session.user) {
      res.redirect('/');
    } else {
      res.render('register', { title: 'Регистрация', loginSelected: true });
    }
};

// Handle registration on POST
exports.auth_register_post = function(req, res) {
    // Validation

    if(req.body.pass != req.body.rpass) return res.status(400).send({ msg: 'Введенные пароли не совпадают' });

    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
      return;
    }

    // Check email
    User.findOne({ email: req.body.email })
    .then(function (user) {
      if (user) {
        res.render('register', {
          title: 'Регистрация',
          loginSelected: true,
          errorMsg: 'Пользователь с таким адресом электронной почты уже зарегистрирован.',
          inputValues: {
            fname: req.body.fname,
            sname: req.body.sname,
            email: req.body.email,
            bio: req.body.bio
          }
        });
        return;
      } else {
        return new Promise(function(resolve, reject) {
          if(req.files[0]) {
            if(req.files[0].mimetype.indexOf('image') !== -1) {
              if(req.files[0].size > 52428800) {
                res.render('register', {
                  title: 'Регистрация',
                  loginSelected: true,
                  errorMsg: 'Максимальный объем загружаемого изображения 50 МБ',
                  inputValues: {
                    fname: req.body.fname,
                    sname: req.body.sname,
                    email: req.body.email,
                    bio: req.body.bio
                  }
                });
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
          } else {
            resolve(null);
          }
        })
      }
    })
    .then(function (photo) {
      // Create token and user 2735c02ec158bf441b169181e6fa64c7
      var tokenText = crypto.randomBytes(16).toString('hex');
      bcrypt.hash(tokenText, 5, function(err, hash) {
         var token = new Token({ hash: hash });
         token.save()
         .then(function (token) {
           bcrypt.hash(req.body.pass, 10, function(err, passHash) {
             var user = new User({
              fname: req.body.fname, sname: req.body.sname,
              email: req.body.email, password: passHash,
              bio: req.body.bio, token: { token_type: 'email_confirm', ref: token._id }
             });

             if(photo) {
               user.photo = photo;
             }
             user.save()
             .then(function (user) {
                // Send confrimation mail
                var transporter = nodemailer.createTransport({
                  host: 'smtp.yandex.ru',
                  port: 465,
                  secure: true,
                  auth: { user: 'no-reply-csp', pass: 'qqQ.123'}
                });//({ service: 'Sendgrid', auth: { user: 'dnldd', pass: 'qqQ.123' } });
                var mailOptions = {
                  from: 'no-reply-csp@yandex.ru',//'no-reply@csp.ru',
                  to: user.email,
                  subject: 'Подтверждение электронной почты',
                  text: 'Здравствуйте,\n\n' + 'Перейдите по следующей ссылке для подтверждения аккаунта:'
                     + req.protocol + '://' + req.get('host') + '/auth/confirmation/' + user.token.token_type + '/' + tokenText
                };
                transporter.sendMail(mailOptions, function (err) {
                  if (err) { console.log(err.message) };
                  res.render('confirmation', { title: 'Регистрация почти завершена', email: user.email, register: true });
                });
             });
           });
         })
         .catch(function(e) {
           console.log(e.message);
         })
      });
    })
    .catch(function(e) {
      console.log(e.message);
    });
};

// Handle login on POST
exports.auth_login_post = function(req, res) {
    User.findOne({ email: req.body.email }).exec(function(err, user) {
      if(err) {
        console.log(err.message);
        return;
      }
      if(user) {
        if(user.is_confirmed) {
          bcrypt.compare(req.body.password, user.password, function(err, result) {
            if(result) {
              req.session.user = user._id;
              req.session.priv = user.priv;
              req.session.save();
              res.cookie().send(true);
            } else {
              res.send(false);
            }
          });
        }
      } else {
        res.send(false);
      }
    });
};

//
exports.auth_logout_post = function(req, res) {
  req.session.destroy();
  res.cookie('usr', {expires: Date.now()});
  res.redirect('/');
};

// Display confirm page on GET
exports.auth_confirmToken_get = function(req, res) {
    switch(req.params.tokenType) {
      case 'email_confirm':
        res.render('confirmToken', { title: 'Подтверждение электронной почты', text: 'Введите адрес электронной почты для завершения регистрации' });
        break;
      case 'pass_reset':
        res.render('confirmToken', { title: 'Восстановление пароля', text: 'Электронная почта', pass: true });
        break;
    }
};

// Handle confirm on POST
exports.auth_confirmToken_post = function(req, res) {
    switch(req.params.tokenType) {
      case 'email_confirm':
        User.findOne({ email: req.body.email }).populate('token.ref').exec(function (err, user) {
          if(user) {
            bcrypt.compare(req.params.tokenHash, user.token.ref.hash, function(err, result) {
              if(result) {
               user.is_confirmed = true;
               user.save(function(err) {
                 if(err) { console.log(err.message) };
                 req.session.user = user._id;
                 req.session.priv = user.priv;
                 req.session.save();
                 res.redirect('/');
               });
              } else {
               res.render('confirmToken', { title: 'Подтверждение электронной почты', text: 'Введите адрес электронной почты для завершения регистрации', errorMsg: 'Проверьте корректность введенных данных' });
              }
            });
          } else {
            res.render('confirmToken', { title: 'Подтверждение электронной почты', text: 'Введите адрес электронной почты для завершения регистрации', errorMsg: 'Проверьте корректность введенных данных' });
          }
        });
        break;
      case 'pass_reset':
        User.findOne({ email: req.body.email }).populate('token.ref')
        .then(function (user) {
          if(user) {
            if(req.body.pass == req.body.rpass) {
              return bcrypt.compare(req.params.tokenHash, user.token.ref.hash)
            } else {
              res.render('confirmToken', { title: 'Сброс пароля', text: 'Электронная почта', pass: true, errorMsg: 'Введенные пароли не одинаковые' });
            }
          } else {
            res.render('confirmToken', { title: 'Сброс пароля', text: 'Электронная почта', pass: true, errorMsg: 'Пользователь с указанным адресом электронной почты не найден' });
          }
        })
        .then(function (result) {
          if(result) {
            return bcrypt.hash(req.body.pass, 10);
          } else { reject(); }
        })
        .then(function (hash) {
          return User.updateOne({ email: req.body.email }, { password: hash });
        })
        .then(function (result) {
          res.redirect('/?login=true')
        })
        .catch(function (e) {
          console.log(e);
          res.render('confirmToken', { title: 'Сброс пароля', text: 'Электронная почта', pass: true, errorMsg: 'Произошла ошибка при отправке данных. Попробуй снова или обратитесь в поддержку' });
        })
        break;
    }
};

exports.auth_passReset_get = function(req, res) {
  if(req.session.user) {
    res.redirect('/');
  } else {
    res.render('passReset', { title: 'Сброс пароля', loginSelected: true });
  }
}

exports.auth_passReset_post = function(req, res) {
  var tokenText;
  User.findOne({ email: req.body.email })
  .then(function (result) {
    if(result) {
      tokenText = crypto.randomBytes(16).toString('hex');
      return bcrypt.hash(tokenText, 5);
    } else {
      res.render('passReset', { title: 'Сброс пароля', loginSelected: true, errorMsg: 'Пользователь с указанным адресом электронной почты не найден', email: req.body.email });
    }
  })
  .then(function (hash) {
    var token = new Token({ hash: hash });
    return token.save();
  })
  .then(function (token) {
    return User.updateOne({ email: req.body.email }, { token: { token_type: 'pass_reset', ref: token._id } });
  })
  .then(function (result) {
    // Send confrimation mail
    var transporter = nodemailer.createTransport({
      host: 'smtp.yandex.ru',
      port: 465,
      secure: true,
      auth: { user: 'no-reply-csp', pass: 'qqQ.123'}
    });//({ service: 'Sendgrid', auth: { user: 'dnldd', pass: 'qqQ.123' } });
    var mailOptions = {
      from: 'no-reply-csp@yandex.ru',//'no-reply@csp.ru',
      to: req.body.email,
      subject: 'Сброс пароля',
      text: 'Здравствуйте,\n\n' + 'Перейдите по следующей ссылке для сброса пароля от аккаунта:'
         + req.protocol + '://' + req.get('host') + '/auth/confirmation/pass_reset/' + tokenText
    };
    transporter.sendMail(mailOptions, function (err) {
      if (err) { console.log(err.message) };
      res.render('confirmation', { title: 'Сброс пароля почти завершен', email: req.body.email });
    });
  })
  .catch(function (e) {
    console.log(e);
  })

}
