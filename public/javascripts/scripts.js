function setHeight(elem) {
  var height = document.documentElement.clientHeight;
  elem.style.height = height - 100 + 'px';
}

function toggleLogin() {
    var loginElem = document.getElementsByClassName('login-div')[0];
    if(loginElem.classList.contains('div_type_hidden')) {
      loginElem.classList.remove('div_type_hidden');
      document.getElementsByTagName('body')[0].style.overflow = 'hidden';
      document.getElementsByClassName('simple-div_type_login')[0].style.display = 'flex';
      document.getElementsByClassName('login-div-wrapper')[0].style.display = 'flex';
    } else {
      loginElem.classList.add('div_type_hidden');
      document.getElementsByTagName('body')[0].style.overflow = 'auto';
      document.getElementsByClassName('simple-div_type_login')[0].style.display = 'none';
      document.getElementsByClassName('login-div-wrapper')[0].style.display = 'none';
    }
}

function loginFieldsClick(e) {
  var field = e.target;
  if(field.id == 'loginPass') {
    field.type = 'password';
  }
  if(field.value == 'Пароль' || field.value == 'Электронная почта') {
    field.value = '';
  }
}

function loginFieldsBlur(e) {
  var field = e.target;
  if(field.id == 'loginPass') {
    if(field.value == '') {
      field.value = 'Пароль';
      field.type = 'text';
    }
  } else {
    if(field.value == '') {
      field.value = 'Электронная почта';
    }
  }
}

function minimizeHeader() {
  var scrollpos = window.pageYOffset;
  var header = document.getElementsByClassName('header')[0];

  if(scrollpos > 0 && !header.classList.contains('header_type_hidden')) {
    header.classList.add('header_type_hidden');
    document.getElementsByClassName('main')[0].classList.add('main_type_header-hidden');
  } else if (scrollpos === 0) {
    header.classList.remove('header_type_hidden');
    document.getElementsByClassName('main')[0].classList.remove('main_type_header-hidden');
  }

  return;
}

function validateField(filter, field, errorField) {
  switch(filter) {
    case 'name':
      var regex = new RegExp('^[a-zа-яё]+(?: [a-zа-яё]+)?$', 'i');
      if(regex.test(field.value) && field.value.length <= 80) {
        field.classList.remove('sign-form__input_type_wrong');
        field.classList.add('sign-form__input_type_right');
        return true;
      } else {
        field.classList.remove('sign-form__input_type_right');
        field.classList.add('sign-form__input_type_wrong');
        return false;
      }
      break;
    case 'email':
      var regex = new RegExp('^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$', 'i');
      if(regex.test(field.value) && field.value.length <= 256 && field.value.length >= 5) {
        field.classList.remove('sign-form__input_type_wrong');
        field.classList.add('sign-form__input_type_right');
        return true;
      } else {
        field.classList.remove('sign-form__input_type_right');
        field.classList.add('sign-form__input_type_wrong');
        return false;
      }
      break;
    case 'pass':
      var regex = new RegExp('^[A-Za-z0-9!@#$%^&*()_+=-`~\\\]\[{}|\';:/.,?><]*$', 'i');
      if(regex.test(field.value) && field.value.length <= 50 && field.value.length >= 5) {
        field.classList.remove('sign-form__input_type_wrong');
        field.classList.add('sign-form__input_type_right');
        return true;
      } else {
        field.classList.remove('sign-form__input_type_right');
        field.classList.add('sign-form__input_type_wrong');
        return false;
      }
      break;
    case 'bio':
      if(field.value.length <= 500) {
        field.classList.remove('sign-form__input_type_wrong');
        field.classList.add('sign-form__input_type_right');
        return true;
      } else {
        field.classList.remove('sign-form__input_type_right');
        field.classList.add('sign-form__input_type_wrong');
        return false;
      }
      break;
    case 'media':
      errorField.innerText = '';
      var file = field.files[0];
      var result;
      if(file.type.indexOf('image') !== -1) {
        if(file.size > 52428800) {
          errorField.innerText = 'Максимальный объем загружаемого изображения 50 МБ, видео - 100 МБ';
          field.value = '';
          result = false;
        } else {
          result = true;
        }
      } else if(file.type.indexOf('video') !== -1) {
        if(file.size > 102400000) {
          errorField.innerText = 'Максимальный объем загружаемого изображения 50 МБ, видео - 100 МБ';
          field.value = '';
          result = false;
        } else {
          result = true;
        }
      } else {
        errorField.innerText = 'Загруженный файл не является изображением или видео';
        field.value = '';
        result = false;
      }

      return result;
      break;
    }
}

function tryLogin() {
  var email = document.getElementsByName('login-email')[0].value;
  var pass = document.getElementsByName('login-pass')[0].value;
  axios
  .post("/auth/login", {
    email: email,
    password: pass
  }, { contentType: 'application/json',
       xhrFields: { withCredentials: true },
       credentials: 'same-origin',
       crossDomain: true })
  .then(function(response) {
    if(response.data) {
      window.location = '/';
    }
    else {
      document.getElementById('login-error').innerText = 'Неверный адрес электронной почты или пароль';
    }
  })
}

function previewPost(id) {
  var post = axios
  .get("/?preview=" + id + "&async=true", {},
     { contentType: 'application/json',
       xhrFields: { withCredentials: true },
       credentials: 'same-origin',
       crossDomain: true })
  .then(function(response) {
    if(response.data) {
      if(document.getElementById('allPostsCount')) {
        document.getElementById('allPostsCount').remove();
      }

      var elem = document.getElementById('top-preview');
      if(document.getElementById('top-preview')) {
        document.getElementById('top-preview').remove();
      }

      document.getElementsByClassName('div-column')[0].innerHTML += response.data;
    }
  })

  history.pushState({}, '', '?preview='+id)
}

function postAct(postId) {
  axios
  .post('/posts/' + postId + '/like', {},
     { contentType: 'application/json',
       xhrFields: { withCredentials: true },
       credentials: 'same-origin',
       crossDomain: true })
  .then(function(response) {
    if(response.data) {
      var elem = document.getElementById('like' + postId);
      if(response.data.result === 'liked') {
        elem.classList.add('like-button_type_active');
        elem.children.item(2).innerText++;
      }
      else if(response.data.result === 'unliked') {
        elem.classList.remove('like-button_type_active');
        elem.children.item(2).innerText--;
      }
    }
  })
}

function toggleReplyForm(parentId, e) {
  if(e.lastChild.textContent == '-') {
    document.getElementById(parentId).style.display = 'none';
    e.lastChild.textContent = '';
  } else {
    document.getElementById(parentId).style.display = 'flex';
    e.lastChild.textContent = '-';
  }
}

function getPosts(sort, search, type, user, skip) {
  var url = '/?async=true';

  if(sort) {
    url += '&sort=' + sort;
  }
  if(search) {
    url += '&search=' + search;
  }
  if(user) {
    url += '&user=' + user;
  }
  if(type) {
    url += '&type=' + type;
  }
  if(skip) {
    url += '&skip=' + skip;
  }

  axios
  .get(url, {},
     { contentType: 'application/json',
       xhrFields: { withCredentials: true },
       credentials: 'same-origin',
       crossDomain: true })
  .then(function(response) {
    if(response.data) {
      if(skip) {
        var feed = document.getElementById('feed');
        feed.removeChild(feed.lastChild);
        document.getElementById('feed').innerHTML += response.data;
      } else {
        document.getElementById('feed').innerHTML = response.data;
      }

    }
  })
}

function deletePost(id) {
  var url = '/posts/' + id;
  var confirmed = confirm('Вы уверены, что хотите удалить данную публикацию? После этого действия ее нельзя будет восстановить');
  if(confirmed) {
    axios
    .delete(url, {},
      { contentType: 'application/json',
        xhrFields: { withCredentials: true },
        credentials: 'same-origin',
        crossDomain: true })
    .then(function(response) {
      window.location = '/';
    });
  }
}

function deleteComment(id) {
  var url = '/posts/comment?id=' + id;
  var confirmed = confirm('Вы уверены, что хотите удалить данный комментарий? После этого действия его нельзя будет восстановить');
  if(confirmed) {
    axios
    .delete(url, {},
      { contentType: 'application/json',
        xhrFields: { withCredentials: true },
        credentials: 'same-origin',
        crossDomain: true })
    .then(function(response) {
      if(response.data) {
        window.location.reload(false);
      }
    });
  }
}

function handleNextPosts(e, sort, search, type, user, skip) {
  getPosts(sort, search, type, user, skip);
  e.remove();
}

function getStats() {
  return axios
  .get('/stats?async=true', {},
    { contentType: 'application/json',
      xhrFields: { withCredentials: true },
      credentials: 'same-origin',
      crossDomain: true })
  .then(function (response) {
    if(response.data) {
      return response.data;
    }
  })
}

function getLineChart(ctx, data, labels) {

  var dataObj = {
    labels: labels,
    datasets: [{
      data: data,
      borderColor: 'rgba(24, 113, 113, .6)', //'rgba(21, 46, 104, .5)',
      backgroundColor: 'rgba(24, 113, 113, .3)' //'rgba(63, 88, 145, .5)'
    }]
  }

  var options = {
    legend: {
      display: false
    },
    layout: {
      padding: {
        left: 0,
        right: -50,
        top: 0,
        bottom: 0
      }
    }
  }

  var lineChart = new Chart(ctx, {
      type: 'line',
      data: dataObj,
      options: options
  });
}

function getBarChart(ctx, data, labels) {
  var colors = [
    'rgba(0, 135, 108, .4)',
    'rgba(81, 164, 114, .4)',
    'rgba(137, 191, 119, .4)',
    'rgba(194, 217, 128, .4)',
    'rgba(255, 241, 143, .4)',
    'rgba(252, 199, 107, .4)',
    'rgba(245, 155, 86, .4)',
    'rgba(233, 109, 78, .4)',
    'rgba(212, 61, 81, .4)'
  ]

  var slicedColors = colors.slice(0, data.length);

  var borderColors = slicedColors.map(function (color) {
    return color.substr(0, color.length - 3) + '1)';
  })

  var dataObj = {
    labels: labels,
    datasets: [{
      data: data,
      backgroundColor: slicedColors,
      borderColor: borderColors,
      borderWidth: 1,
      minBarLength: 5
    }]
  }

  var options = {
    legend: {
      display: false
    }
  }

  var barChart = new Chart(ctx, {
      type: 'horizontalBar',
      data: dataObj,
      options: options
  });


}

function vwToPx(vw) {
  var body = document.getElementsByTagName('body')[0];
  var x = window.innerWidth || document.documentElement.clientWidth || body.clientWidth;
  var result = (x * vw)/100;

  return result;
}
