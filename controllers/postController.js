var Post = require('../models/post');
var PostType = require('../models/posttype');
var Like = require('../models/like');
var Comment = require('../models/comment');
var User = require('../models/user');
var cloudinary = require('../config/cloudinaryConfig');
var async = require('async');

var uploadFiles = function (files) {
  var uploadRes = [];
  if(files.length <= 6) {
    files.forEach(async function(file, index) {
      var promise = new Promise(function(resolve, reject) {
        if(file.mimetype.indexOf('image') !== -1) {
          if(file.size > 52428800) {
            reject('Максимальный объем загружаемого изображения 50 МБ, видео - 100 МБ');
          } else {
            cloudinary.uploader.upload(file.path,
              { folder: 'image' },
              function(err, result) {
                if(err) { reject(err) }
                resolve(result.secure_url);
              });
          }
        }
        else if(file.mimetype.indexOf('video') !== -1) {
          if(file.size > 102400000) {
            reject('Максимальный объем загружаемого изображения 50 МБ, видео - 100 МБ');
          } else {
            cloudinary.uploader.upload(file.path,
              { folder: 'video',
                resource_type: 'video' },
              function(err, result) {
                if(err) { reject(err) }
                resolve(result.secure_url);
              });
          }
        }
        else {
          reject('Загруженный файл не является изображением или видео');
        }
      })
      uploadRes.push(promise);
    })
  }
  return uploadRes;
}

var deleteFiles = function(urlArray) {
  var results = [];
  urlArray.forEach(function (item) {
    var sliceStart = item.lastIndexOf('image');
    if(sliceStart > -1) {
      var publicId = item.slice(sliceStart);
      publicId = publicId.slice(0, publicId.indexOf('.'));
    } else {
      sliceStart = item.lastIndexOf('video');
      var publicId = item.slice(sliceStart);
      publicId = publicId.slice(0, publicId.indexOf('.'));
    }

    cloudinary.uploader.destroy(publicId, function(error,result) {
      if(error) {
        console.log(error);
      }
      results.push(result);
    });
  });
  return results;
}

//
exports.get_geo_objects = function(req, res) {
  var response = [];
  Post.find().populate('post_type').exec(function(err, posts) {
    if(err) { console.log(err.message) }

    posts.forEach(function(post) {
      var postForMap = {
        id: post._id,
        address: post.address,
        type: post.post_type.type,
        coords: [post.coordinates.x, post.coordinates.y]
      }
      response.push(postForMap);
    })
    res.send(response);
  })
}

// Display list of all Posts.  GET
exports.post_list = function(req, res) {
    // Max posts per one request
    const lim = 10;

    if(!req.query.skip) {
      req.query.skip = 0;
    }

    req.query.skip = Number(req.query.skip);

    var feedParams = {};
    var sort = {};
    switch(req.query.sort) {
      case 'new':
        sort['created'] = 'desc';
        feedParams.sort = 'new';
        break;
      case 'useful':
        sort['likes_count'] = 'desc';
        feedParams.sort = 'useful';
        break;
      case 'comments':
        sort['reply_count'] = 'desc';
        feedParams.sort = 'comments';
        break;
      default:
        sort['created'] = 'desc';
        feedParams.sort = 'new';
        break;
    }


    if(req.query.search) {
      var queryObj = {
        $or:[
          { text: { '$regex' : req.query.search, '$options' : 'i' } },
          { address: { '$regex' : req.query.search, '$options' : 'i' } }
        ]
      }
      var searchPromise = Post.find({  }).populate('post_type', 'type icon').populate('author', '_id fname sname fullname').sort(sort).skip(req.query.skip).limit(lim);
    } else if(req.query.user) {
      var queryObj = {
        author: req.query.user
      }
      feedParams.user = req.query.user;
    } else {
      var queryObj = {}
    }

    if(req.query.type == 'any' || typeof req.query.type == 'undefined') {
      req.query.type = null;
      feedParams.type = null;
    } else {
      queryObj.post_type = req.query.type;
      feedParams.type = req.query.type;
    }

    Post.find(queryObj).populate('post_type', 'type icon').populate('author', '_id fname sname fullname').sort(sort).skip(req.query.skip).limit(lim)
    .then(async function(posts) {
      var postArrPromises = posts.map(async function(post) {
        var postObj = {
          _id: post._id,
          address: post.address,
          reply_count: post.reply_count,
          likes_count: post.likes_count,
          post_type: post.post_type,
          author: post.author
        }

        if(req.session.user == post.author._id || req.session.priv == 'admin') {
          postObj.isEditable = true;
        } else {
          postObj.isEditable = false;
        }

        var textSlicePos = post.text.slice(0, 250).lastIndexOf('. ');
        postObj.text = post.text.slice(0, textSlicePos);
        postObj.created = post.createdFormated = post.created.getDate() + '.' + (post.created.getMonth() + 1) + '.' + post.created.getFullYear() + ' ' + post.created.getHours() + ':' + post.created.getMinutes();
        post.attached.length = 3;

        var mediaArr = post.attached.map(function(element) {
          if(element.indexOf('image') !== -1) return { image: true, src: element }
          if(element.indexOf('video') !== -1) return { video: true, src: element }
        });
        postObj.attached = mediaArr;
        postObj.url = post.url;

        return await Like.findOne({ post: post._id, user: req.session.user })
        .then(function(like) {
          if(like) {
            postObj.isLiked = true;
          } else {
            postObj.isLiked = false;
          }

          return postObj;
        });
      });

      return Promise.all(postArrPromises);
    })
    .then(function(postArr) {
      Post.countDocuments(queryObj).exec(function(err, count) {
        if(err) {
          console.log(err);
        }
        if(count > (lim + req.query.skip)) {
          feedParams.skip = req.query.skip + lim;
        }

        if(req.query.async) {
          res.render('partials/feed', { postArr: postArr, layout: false, feedParams: feedParams, authed: true });
        } else {
          PostType.find({}).sort({ type: 'asc' }).exec(function(err, types) {
            if(err) {
              console.log(err);
            }
            res.render('index', { indexSelected: true, postArr: postArr, allPostsCount: count, feedParams: feedParams, postTypes: types });
          })
        }
      })
    })
    .catch(function(e) {
      console.log(e.message);
    })

};

exports.post_preview = function(req, res, next) {
    if(typeof req.query.preview == 'string') {
      Post.findOne({ _id: req.query.preview }).populate('post_type', 'type icon').populate('author', '_id fname sname fullname').exec(async function(err, post) {
        if(err) {
          console.log(err.message);
          next();
        }

        res.locals.postPreview = {
          _id: post._id,
          address: post.address,
          coordinates: post.coordinates,
          reply_count: post.reply_count,
          likes_count: post.likes_count,
          post_type: post.post_type,
          author: post.author
        };

        if(req.session.user == post.author._id || req.session.priv == 'admin') {
          res.locals.postPreview.isEditable = true;
        } else {
          res.locals.postPreview.isEditable = false;
        }

        var isLikedPromise = new Promise(function (resolve, reject) {
          Like.findOne({ post: post._id, user: req.session.user }, function(err, like) {
            if(err) {
              console.log(err.message);
              reject(false);
            }
            if(like) {
              resolve(true);
            } else {
              resolve(false);
            }
          })
        });

        var textSlicePos = post.text.slice(0, 250).lastIndexOf('. ');
        res.locals.postPreview.text = post.text.slice(0, textSlicePos);
        res.locals.postPreview.created = post.createdFormated = post.created.getDate() + '.' + (post.created.getMonth() + 1) + '.' + post.created.getFullYear() + ' ' + post.created.getHours() + ':' + post.created.getMinutes();
        post.attached.length = 3;
        var mediaArr = post.attached.map(function(element) {
          if(element.indexOf('image') !== -1) return { image: true, src: element }
          if(element.indexOf('video') !== -1) return { video: true, src: element }
        });
        res.locals.postPreview.attached = mediaArr;
        res.locals.postPreview.url = post.url;

        isLikedPromise.then(function(isLiked) {
          res.locals.postPreview.isLiked = isLiked;
          if(req.query.async) {
            res.render('partials/postPreview', { postPreview: res.locals.postPreview, layout: false });
            return;
          }
          next();
        })
      })
    } else {
      next();
    }
};

// Display detail page for a specific Post.   GET
exports.post_detail = function(req, res, next) {
    if(typeof req.params.postId == 'string') {
      Post.findOne({ _id: req.params.postId }).populate('post_type author', 'type icon fname sname photo').exec(async function(err, post) {
        if(err) {
          console.log(err.message);
          next();
        }

        res.locals.postDetails = {
          _id: post._id,
          address: post.address,
          coordinates: post.coordinates,
          reply_count: post.reply_count,
          likes_count: post.likes_count,
          post_type: post.post_type,
          author: post.author,
          text: post.text
        };

        if(req.session.user == post.author._id || req.session.priv == 'admin') {
          res.locals.postDetails.isEditable = true;
        } else {
          res.locals.postDetails.isEditable = false;
        }

        var isLikedPromise = new Promise(function (resolve, reject) {
          Like.findOne({ post: post._id, user: req.session.user }, function(err, like) {
            if(err) {
              console.log(err.message);
              reject(false);
            }
            if(like) {
              resolve(true);
            } else {
              resolve(false);
            }
          })
        });

        res.locals.postDetails.created = post.createdFormated = post.created.getDate() + '.' + (post.created.getMonth() + 1) + '.' + post.created.getFullYear() + ' ' + post.created.getHours() + ':' + post.created.getMinutes();
        var mediaArr = post.attached.map(function(element) {
          if(element.indexOf('image') !== -1) return { image: true, src: element }
          if(element.indexOf('video') !== -1) return { video: true, src: element }
        });
        res.locals.postDetails.attached = mediaArr;
        res.locals.postDetails.url = post.url;

        isLikedPromise.then(function(isLiked) {
          res.locals.postDetails.isLiked = isLiked;
          next();
        });
      })
    } else {
      res.send(404);
    }
};

// Display report a problem form on GET.
exports.report_get = function(req, res) {
    if(req.session.user) {
      var postTypes = PostType.find(function(err, result) {
        res.render('report', { title: 'Сообщить о проблеме', postTypes: result });
      });
    } else {
      res.redirect('/?login=true');
    }
};

// Handle problem report on POST.
exports.report_post = async function(req, res) {
    var uploadPromises = uploadFiles(req.files);
    Promise.all(uploadPromises)
    .then(function(result) {
      var post = new Post({
        post_type: req.body.post_type,
        coordinates: { x: req.body.coords.split(',')[0], y:  req.body.coords.split(',')[1] },
        address: req.body.address,
        text: req.body.text,
        author: req.session.user,
        attached: result
      })

      post.save(function(err, post) {
        if(err) {
          console.log(err.message);
          reject('При публикации возникли технические неполадки. Попробуйте обновить страницу или обратиться в службу поддержки');
        }
        res.redirect('/?preview=' + post._id);
      });
    })
    .catch((err) => {
      res.render('report', {
        title: 'Сообщить о проблеме',
        errorMsg: err.message,
        inputValues: { address: req.body.address, coords: req.body.coords, text: req.body.text }
      });
    })
};

exports.post_like = function(req, res) {
  Like.findOne({ post: req.params.postId, user: req.session.user }, function(err, like) {
    if(err) {
      console.log(err.message);
      return;
    }
    if(like) {
      Like.deleteOne({ _id: like._id }, function(err) {
        if(err) {
          res.send('');
        }

        Post.updateOne({ _id: req.params.postId}, {$inc: {likes_count: -1}}, {},
        function(err, numberAffected) {
          res.json({ result: 'unliked' });
        });
      })
    } else {
      var like = new Like({ post: req.params.postId, user: req.session.user });
      like.save(function(err, like) {
        Post.updateOne({ _id: req.params.postId}, {$inc: {likes_count: 1}}, {},
        function(err, numberAffected) {
          res.json({ result: 'liked' });
        });
      })
    }
  });
}

exports.post_delete = function(req, res, next) {
  Post.findOne({ _id: req.params.postId })
  .then(function (post) {
    if(post.attached) {
      deleteFiles(post.attached);
    }

    if(post.author == req.session.user || req.session.priv == 'admin') {
      return Post.deleteOne({ _id: req.params.postId });
    } else {
      res.send('');
    }
  })
  .then(function (deleted) {
    return Like.deleteMany({ post: req.params.postId });
  })
  .then(function (deleted) {
    next();
  })
  .catch(function (e) {
    console.log(e);
  })
}

exports.get_stats = function(req, res) {
  var stats = {}
  var now = new Date();

  PostType.find({}).sort({ type: 'asc' })
  .then(function (types) {
    var typesBar = types.map(async function (post_type) {
      return { type: post_type.type, count: await Post.countDocuments({ post_type: post_type._id }) }
    })

    return Promise.all(typesBar);
  })
  .then(async function (typesBar) {
    stats.typesBar = typesBar;

    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var totals = {};
    totals.posts = await Post.countDocuments({});
    totals.postsToday = await Post.countDocuments({ created: { $gte: today }});
    totals.comments = await Comment.countDocuments({});
    totals.users = await User.countDocuments({});

    return totals;
  })
  .then(async function (totals) {
    stats.totals = totals;

    var reportsLine = [];
    for(var i = 0; i <= now.getMonth(); i++) {
      var monthStart = new Date(now.getFullYear(), i, 1);
      var monthEnd = new Date(now.getFullYear(), i + 1, 0);
      var count = await Post.countDocuments({
        created: {
          $gte: monthStart,
          $lte: monthEnd
        }}
      )

      reportsLine.push({ month: i, count: count });
    }

    return reportsLine;
  })
  .then(function (reportsLine) {
    stats.reportsLine = reportsLine;

    res.send(stats);
  })
  .catch(function (e) {
    console.log(e);
  })
}
