var express = require('express');
var router = express.Router();

// Require controller modules.
var post_controller = require('../controllers/postController');
var comment_controller = require('../controllers/commentController');

//
router.get('/', post_controller.post_preview, post_controller.post_list);

//
router.get('/map', post_controller.get_geo_objects);

//
router.get('/help', function(req, res) {
  res.render('help', { title: 'Помощь', helpSelected: true });
});

//
router.get('/stats', function(req, res) {
  if(req.query.async) {
    post_controller.get_stats(req, res);
  } else {
    res.render('stats', { title: 'Статистика', statsSelected: true });
  }
});

module.exports = router;
