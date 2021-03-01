var express = require('express');
var multer  = require('multer');
var upload = multer({ dest: '../public/images/upload'});
var router = express.Router();

// Require controller modules.
var post_controller = require('../controllers/postController');
var comment_controller = require('../controllers/commentController');

//
router.get('/report', post_controller.report_get);

//
router.post('/report', upload.any(), post_controller.report_post);

//
router.post('/comment', upload.any(), comment_controller.comment_add_post);

//
router.delete('/comment', comment_controller.comment_delete);

//
router.get('/:postId', post_controller.post_detail, comment_controller.comment_list_get);

//
router.delete('/:postId', post_controller.post_delete, comment_controller.comment_delete);

//
router.post('/:postId/like', post_controller.post_like);

module.exports = router;
