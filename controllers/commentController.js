var Comment = require('../models/comment');
var Post = require('../models/post');
var cloudinary = require('../config/cloudinaryConfig');

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

                if(err) { reject(err); }
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
      console.log(result);
      results.push(result);
    });
  });
  return results;
}


exports.comment_list_get = function(req, res, next) {
    if(req.params.postId) {
      res.locals.comments = [];
      Comment.find({ post: req.params.postId, parent: { '$exists' : false } }).populate('author', 'fname sname photo').sort({ created: -1 })
      .then(function(comments) {
        var replyPromises = comments.map(async function(comment) {
          if(comment.author._id == req.session.user || req.session.priv == 'admin') {
            comment.isEditable = true;
          }
          var mediaArr = comment.attached.map(function(element) {
            if(element.indexOf('image') !== -1) return { image: true, src: element }
            if(element.indexOf('video') !== -1) return { video: true, src: element }
          });
          comment.attached = mediaArr;

          comment.createdFormated = comment.created.getDate() + '.' + (comment.created.getMonth() + 1) + '.' + comment.created.getFullYear() + ' ' + comment.created.getHours() + ':' + comment.created.getMinutes();
          return await Comment.find({ parent: comment._id }).populate('author', 'fname sname photo').sort({ created: 1 })
          .then(function(replies) {
            if(typeof replies !== 'undefined' && replies.length > 0) {
              replies.forEach(function (reply) {
                if(reply.author._id == req.session.user || req.session.priv == 'admin') {
                  reply.isEditable = true;
                }
                reply.createdFormated = reply.created.getDate() + '.' + (reply.created.getMonth() + 1) + '.' + reply.created.getFullYear() + ' ' + reply.created.getHours() + ':' + reply.created.getMinutes();
                var replyMediaArr = reply.attached.map(function(element) {
                  if(element.indexOf('image') !== -1) return { image: true, src: element }
                  if(element.indexOf('video') !== -1) return { video: true, src: element }
                });
                reply.attached = replyMediaArr;
              });
              var commentWithReplies = {
                comment: comment,
                replies: replies
              }
            } else {
              var commentWithReplies = {
                comment: comment,
                replies: null
              }
            }
            return commentWithReplies;
          })
        });

        return Promise.all(replyPromises);
      })
      .then(function(commentsWithReplies) {
        res.render('details', { title: res.locals.postDetails.post_type.type + ' по адресу ' + res.locals.postDetails.address, comments: commentsWithReplies });
      })
      .catch(function(e) {
        console.log(e.message);
      });
  }
};

// Handle comment create on POST.
exports.comment_add_post = async function(req, res) {
    var uploadPromises = uploadFiles(req.files);
    Promise.all(uploadPromises)
    .then(function(result) {
      if(req.body.parent) {
        var comment = new Comment({
          post: req.body.post_id,
          parent: req.body.parent,
          author: req.session.user,
          text: req.body.text,
          attached: result
        });
      } else {
        var comment = new Comment({
          post: req.body.post_id,
          author: req.session.user,
          text: req.body.text,
          attached: result
        });
      }

      comment.save(function(err, comment) {
        if(err) {
          console.log(err.message);
          throw new Error('При публикации возникли технические неполадки. Попробуйте обновить страницу или обратиться в службу поддержки');
        }

        if(req.body.parent) {
          Comment.findOneAndUpdate({ _id: req.body.parent }, { $inc: { reply_count: 1 } }, { new: true }).exec(function(err, parent) {
            if(err) {
              console.log(err);
            }
          });
        }

        Post.findOneAndUpdate({ _id: req.body.post_id }, { $inc: { reply_count: 1 } }, { new: true }).exec(function(err, post) {
          if(err) {
            console.log(err);
          }
        });

        res.redirect('/posts/' + req.body.post_id + '#comments');
      });
    })
    .catch((err) => {
      res.render('details', {
        title: 'Сообщить о проблеме',
        errorMsg: err.message,
        inputValues: { address: req.body.address, coords: req.body.coords, text: req.body.text }
      });
    })
};

// Handle comment delete on POST.
exports.comment_delete = function(req, res) {
    if(req.query.id) {
      var postId;
      Comment.findOne({ _id: req.query.id })
      .then(function(comment) {
        postId = comment.post;
        if(comment.parent) {
          Comment.findOneAndUpdate({ _id: comment.parent }, { $inc: { reply_count: -1 } }, { new: true }).exec(function(err, post) {
            if(err) {
              console.log(err);
            }
          });
        }
      })
      .then(function () {
        return Comment.findOne({ _id: req.query.id }).select('attached');
      })
      .then(function (comment) {
        if(comment.attached) {
          deleteFiles(comment.attached);
        }
        return Comment.deleteOne({ _id: req.query.id });
      })
      .then(function (result) {
        return Comment.find({ parent: req.query.id }).select('attached')
      })
      .then(function (commentsArr) {
        commentsArr.forEach(function (comment) {
          if(comment.attached) {
            deleteFiles(comment.attached);
          }
        })
        return Comment.deleteMany({ parent: req.query.id });
      })
      .then(function(result) {
        var inc = 0 - (result.n + 1);
        Post.findOneAndUpdate({ _id: postId }, { $inc: { reply_count: inc } }, { new: true }).exec(function(err, post) {
          if(err) {
            console.log(err);
          }
        });
      })
      .then(function () {
        res.json({ result: 'success' });
      })
      .catch(function (e) {
        console.log(e);
        res.send('');
      })
    } else if(req.params.postId) {
      Comment.find({ post: req.params.postId })
      .then(function (commentsArr) {
        commentsArr.forEach(function (comment) {
          if(comment.attached) {
            deleteFiles(comment.attached);
          }
        })
        return Comment.deleteMany({ post: req.params.postId });
      })
      .then(function (result) {
        res.json({ result: 'success' });
      })
      .catch(function (e) {
        console.log(e);
        res.send('');
      });
    }
};
