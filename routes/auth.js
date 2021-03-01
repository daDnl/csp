/** Модуль маршрутизации, распределяющий запросы, имеющие отношения к работе с авторизацией и регистрацией
 * @module routers/auth
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
 * Контроллер, содержащий описания функций для работы с авторизацией и регистрацией
 * @const
 */
var auth_controller = require('../controllers/authController');

router.get('/register', auth_controller.auth_register_get);

router.post('/register', upload.any(), auth_controller.validate('register'), auth_controller.auth_register_post);

router.post('/login', auth_controller.auth_login_post);

router.get('/logout', auth_controller.auth_logout_post);

router.get('/confirmation/:tokenType/:tokenHash', auth_controller.auth_confirmToken_get);

router.post('/confirmation/:tokenType/:tokenHash', auth_controller.auth_confirmToken_post);

router.get('/password-reset', auth_controller.auth_passReset_get);

router.post('/password-reset', auth_controller.auth_passReset_post);

module.exports = router;
