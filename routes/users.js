/** Модуль маршрутизации, распределяющий запросы, имеющие отношения к работе с пользователями
 * @module routers/users
 * @requires express
 * @requires multer
 */

 /**
 * Модуль express
 * @const
 */
var express = require('express');

/**
 * Модуль multer
 * @const
 */
var multer  = require('multer');
var upload = multer({ dest: '../public/images/upload'});

/**
 * Express маршрутизатор, который будет содержать обрабатывающие функции в соответствии с путями
 * @type {object}
 * @const
 * @namespace usersRouter
 */
var router = express.Router();

/**
 * Контроллер, содержащий описания функций для работы с пользователями
 * @const
 */
var user_controller = require('../controllers/userController');


/**
 * Адрес, служащий для получения страницы профиля авторизованного пользователя или его редактирования
 * @name get/profile
 * @function
 * @memberof module:routers/users~usersRouter
 * @inner
 * @param {string} path - Адрес
 * @param {callback} middleware - обрабатывающие middleware функции
 */
router.get('/profile', function(req, res, next) {
  if(req.query.edit) {
    next()
  } else {
    req.params.userId = req.session.user;
    res.locals.self = true;
    user_controller.user_profile(req, res);
  }
}, user_controller.user_profileEdit_get);

/**
 * Адрес, по которому отправляется форма изменения профиля
 * @name put/profile
 * @function
 * @memberof module:routers/users~usersRouter
 * @inner
 * @param {string} path - Адрес
 * @param {callback} middleware - обрабатывающие middleware функции
 */
router.put('/profile', upload.any(), user_controller.user_profileEdit_post);

/**
 * Адрес, служащий для получения страницы профиля пользователя
 * @name get/profile
 * @function
 * @memberof module:routers/users~usersRouter
 * @inner
 * @param {string} path - Адрес
 * @param {callback} middleware - обрабатывающие middleware функции
 */
router.get('/:userId', user_controller.user_profile);


module.exports = router;
