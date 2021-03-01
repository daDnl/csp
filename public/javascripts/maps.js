function initSpb () {
   var myMap = new ymaps.Map('first_map', {
       center: [59.93, 30.33],
       zoom: 12,
       controls: ['geolocationControl', 'typeSelector', 'fullscreenControl', 'zoomControl']
   });
   return myMap;
}

function initObjectManager() {
  var objectManager = new ymaps.ObjectManager({
      clusterize: true,
      clusterHasBalloon: false,
      geoObjectOpenBalloonOnClick: true,
      hasHint: false,
      preset: 'islands#invertedRedClusterIcons'
  });
  return objectManager;
}

function getObjectsCollection() {
  var result = axios
  .get('/map', {},
     { contentType: 'application/json',
       xhrFields: { withCredentials: true },
       credentials: 'same-origin',
       crossDomain: true })
  .then(function(response) {
    if(response.data) {
    var collection = { type: 'FeatureCollection', features: [] };

    response.data.forEach(function(post) {
        var placemark = {
          type: 'Feature',
          id: post.id,
          geometry: { type: 'Point', coordinates: post.coords },
          options: { preset: 'islands#redDotIcon'},
          properties: { balloonContent: post.type + ' по адресу: ' + post.address }
        }
        collection.features.push(placemark);
      });

      return collection;
    }
  }).catch(function(err) { console.log(err.message) });
  return result;
}

function setObjectsEvents(objectManager) {
  function onObjectEvent(e) {
    var objectId = e.get('objectId');
    switch(e.get('type')) {
      case 'click':
        var objectState = objectManager.getObjectState(objectId);
        objectManager.objects.setObjectOptions(objectId, {
          preset: 'islands#redDotIcon'
        });

        if (objectState.isClustered) {
           objectManager.clusters.state.set('activeObject', objectManager.objects.getById(objectId));
           objectManager.clusters.balloon.open(objectState.cluster.id);
        } else {
           objectManager.objects.balloon.open(objectId);
        }

        previewPost(objectId);
        break;
      case 'mouseenter':
        objectManager.objects.setObjectOptions(objectId, {
          preset: 'islands#darkGreenDotIcon'
        });
        break;
      case 'mouseleave':
        objectManager.objects.setObjectOptions(objectId, {
          preset: 'islands#redDotIcon'
        });
        break;
      case 'blur':
        objectManager.objects.setObjectOptions(objectId, {
          preset: 'islands#redDotIcon'
        });
        objectManager.objects.balloon.close(objectId);
        break;
    }
  }

  objectManager.objects.events.add(['click', 'mouseenter', 'mouseleave', 'blur'], onObjectEvent);
}

function createPlacemark(coords, properties, config) {
  return new ymaps.Placemark(coords, properties, config);
}

function setCenterZoom(map, maxZoom, centerCoords) {
  var zoom = map.action.getCurrentState().zoom;
  setTimeout(function zoomIn () {
    if(zoom < maxZoom) {
      zoom++;
      map.setCenter(centerCoords, zoom);
      setTimeout(zoomIn, 300);
    } else {
      map.setCenter(centerCoords, zoom);
    }
  }, 300);
}

async function setAddressContents(placemark, addressField, coordsField) {
  var coords = placemark.geometry.getCoordinates();
  var address = await getAddress(coords);
  address = address.slice(8);
  address = address.slice(address.indexOf(',') + 2);
  addressField.value = address;
  if(coordsField) {
    coordsField.value = coords[0] + ',' + coords[1];
  }
  placemark.properties.set({ iconContent: address, balloonContent: address });
}

function setUserInput(map, addressField, coordsField) {
  var userPlacemark;
  map.events.add('click', async function (e) {
    var coords = e.get('coords');
    setCenterZoom(map, 15, coords);

    if (userPlacemark) {
        userPlacemark.geometry.setCoordinates(coords);
        setAddressContents(userPlacemark, addressField, coordsField);
    }
    else {
        map.geoObjects.removeAll();
        userPlacemark = createPlacemark(coords, { iconContent: 'поиск...' },
        {
          preset: 'islands#redStretchyIcon',
          draggable: true
        });
        map.geoObjects.add(userPlacemark);

        setAddressContents(userPlacemark, addressField, coordsField);

        userPlacemark.events.add('dragend', async function () {
            var zoom = map.action.getCurrentState().zoom;
            setTimeout(function zoomIn () {
              if(zoom < 15) {
                zoom++;
                map.setCenter(coords, zoom);
                setTimeout(zoomIn, 300);
              } else {
                map.setCenter(coords, zoom);
              }
            }, 300);
            setAddressContents(userPlacemark, addressField, coordsField);
        });
    }
  });
}

function getAddress(coords) {
  var resObj = ymaps.geocode(coords)
  .then(function (res) {
    return res.geoObjects.get(0).getAddressLine();
  });
  return resObj;
}
