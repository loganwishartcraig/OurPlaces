$(document).ready(function() {

  // register variables for global access
  var map;
  var searchServices;
  var searchTextBox;
  var userInterface;
  var prefetchResults;
  var notifications;
  var setMessage;

  function initialize() {

    // used to centralize setting messages
    setMessage = new messageService();

    // sets up interface for user account
    userInterface = new UserInterface();

    // Load google map on element w/ id 'map'
    map = new MapArea("map");

    // Centralize interface w/ google services.
    searchServices = new SearchServices(map.map);

    // binds a textbox class to search box
    searchTextBox = $("#placeSearchInput");

    // sets up predictive search
    prefetchResults = new PrefetchResults("#predictiveContainer");

    // binds controller to update notifications
    notifications = new notificationController("#notifications");

    // register global event handlers
    registerHandlers();

  }

  function messageService() {

    this.setGeneric = function(selector, text) {
      var node = $(selector);

      node.text(text);
      setTimeout(function() {
        node.text('');
      }, 5000);
    };

    this.setConsole = function(data) {
      console.log(data);
    };

  }

  function UserInterface() {

    this.init = function() {
      $.get('/user/getUser').success(function(data) {
        console.log('got user', data);
        this.user = data;
      }.bind(this)).error(setMessage.setConsole);
    };

    this.hasPlace = function(place_id) {

      for (var i = 0; i < this.user.ownedPlaces.length; i++) {
        if (this.user.ownedPlaces[i].place_id === place_id) return true;
      }

      return false;

    };

    this.removePlace = function(placeId) {
      delete this.user.ownedPlaces[placeId];
    };

    this.savePlace = function(place) {

      return (new Promise(function(res, rej) {
        console.log('user interface is saving ', place);

        $.post('/user/addPlace', {
          place: JSON.stringify(place)
        }).success(function(data) {
          this.user.ownedPlaces = data.ownedPlaces;
          res(data);
        }.bind(this)).error(function(err) {
          rej(err);
        });

      }.bind(this)));
    };

    this.removePlace = function(place) {

      return (new Promise(function(res, rej) {
        console.log('user interface is removing ', place);

        $.post('/user/removePlace', {
          place: JSON.stringify(place)
        }).success(function(data) {
          this.user.ownedPlaces = data.ownedPlaces;
          res(data);
        }.bind(this)).error(function(err) {
          rej(err);
        });

      }.bind(this)));
    };


    this.sendRequest = function(friendUsername) {

      return (new Promise(function(res, rej) {

        $.post('/user/addRequest', {
          friendUsername: friendUsername
        }).success(function(msg) {
          res(msg);
        }).error(function(err) {
          rej(err);
        });

      }));

    };

    this.getUserId = function() {
      return this.user.id;
    };


    this.removeFriend = function(friendId) {


      return (new Promise(function(res, rej) {

        $.post('/user/removeFriend', {
          friendId: friendId
        }).success(function(msg) {
          res(msg);
        }).error(function(err) {
          rej(err);
        });

      }));


    };

    this.acceptRequest = function(friendId) {

      return (new Promise(function(res, rej) {

        $.post('/user/acceptRequest', {
          friendId: friendId
        }).success(function(msg) {
          res(msg);
        }).error(function(err) {
          rej(err);
        });

      }));
    };

    this.rejectRequest = function(friendId) {
      return (new Promise(function(res, rej) {

        $.post('/user/removeRequest', {
          friendId: friendId
        }).success(function(msg) {
          res(msg);
        }).error(function(err) {
          rej(err);
        });

      }));
    };

    this.init();

  }

  // Holds functions related to using google search services
  // Used to provide a central location for using search services
  function SearchServices(map) {

    // initalize connection with google places + set relevant map
    this.placeServiceConn = new google.maps.places.PlacesService(map);

    this.map = map;

    // function for building basic search requests
    this.buildSearchRequest = function(keyword) {
      var lat = this.map.getCenter().lat();
      var lng = this.map.getCenter().lng();
      console.log(lat, lng);
      return ({
        location: new google.maps.LatLng(lat, lng),
        radius: '1200',
        keyword: keyword
      });
    };

    // executes a nearby search + calls the callback provided
    this.nearbySearch = function(keyword) {


      var req = this.buildSearchRequest(keyword);
      return (new Promise(function(res, rej) {
        this.placeServiceConn.nearbySearch(req, function(data, status) {
          console.log('search results :', data, status);
          if ((status === google.maps.places.PlacesServiceStatus.OK) || (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS)) {
            res(data);
          } else {
            rej(data);
          }
        });
      }.bind(this)));
    };


  }


  function InfoWindow(map) {


    this.map = map;

    this.pane = new google.maps.InfoWindow();

    this.lastOpen = null;

    this.classes = {
      actionBtn: {
        main: 'save--place--btn',
        save: 'save',
        remove: 'remove'
      }
    };

    this.templates = {
      actionBtn: {
        save: '<button class="{{BTN_CLASS_MAIN}} {{BTN_CLASS_ACTION}}" place_id="{{PLACE_ID}}">Save</button>',
        remove: '<button class="{{BTN_CLASS_MAIN}} {{BTN_CLASS_ACTION}}" place_id="{{PLACE_ID}}">Remove</button>'
      },
      mainContainer: '<div>{{ACTION_BTN}}<span>{{PLACE_NAME}}</span></div>'
    };

    this.buildActionButton = function(place) {
      // WHERE SHOULD THIS CHECK BE? Should a 'savedPlace' flag be set on 'place'? Should 'marker' be passed with a flag? 
      if (userInterface.hasPlace(place.place_id)) {
        return this.templates.actionBtn.remove.replace('{{BTN_CLASS_MAIN}}', this.classes.actionBtn.main).replace('{{BTN_CLASS_ACTION}}', this.classes.actionBtn.remove);
      } else {
        return this.templates.actionBtn.save.replace('{{BTN_CLASS_MAIN}}', this.classes.actionBtn.main).replace('{{BTN_CLASS_ACTION}}', this.classes.actionBtn.save);
      }
    };

    this.buildInfoWindow = function(place) {

      var button = this.buildActionButton(place);

      var contentString = this.templates.mainContainer
        .replace("{{ACTION_BTN}}", button)
        .replace("{{PLACE_NAME}}", place.name)
        .replace("{{PLACE_ID}}", place.place_id);

      return contentString;

    };

    this.refreshActionButton = function(node, place) {
      var btn = $(this.buildActionButton(place));
      btn.on('click', this.generateActionClickHandler(place));
      node.replaceWith(btn);
    };

    this.handleActionClick = function(evt, place) {

      console.log('action button clicked ', evt);
      var node = $(evt.target);
      var place_id = node.attr('place_id');
      if (node.hasClass('save')) {
        userInterface.savePlace(place).then(function(msg) {

          this.refreshActionButton(node, place);

          console.log('success! place saved!', msg);

        }.bind(this), setMessage.setConsole);
      } else {

        userInterface.removePlace(place).then(function(msg) {

          this.refreshActionButton(node, place);

          console.log('success! place removed!', msg);

        }.bind(this), setMessage.setConsole);

      }
    };

    this.generateActionClickHandler = function(place) {
      return (function(evt) {

        this.handleActionClick(evt, place);

      }.bind(this));
    };

    this.createHandler = function(place) {

      console.log('configuring click handler...');

      return (function() {
        var query = '.' + this.classes.actionBtn.main + "[place_id='" + place.place_id + "']";
        var node = $(query);
        $(node).on('click', this.generateActionClickHandler(place));
      }.bind(this));

    };

    // rather have this just take 'position' instead of 'marker' object?
    this.openPane = function(place, marker) {

      if ((this.open) && (this.lastOpen == place.place_id)) return this.closePane();

      console.log('Opening pane');

      var content = this.buildInfoWindow(place);

      this.pane.setContent(content);
      this.pane.open(this.map, marker);
      google.maps.event.addListener(this.pane, 'domready', this.createHandler(place));

      this.lastOpen = place.place_id;
      this.open = true;

      console.log(this.pane);

    };

    this.closePane = function() {
      this.open = false;
      this.pane.close();
    };

  }

  function MapArea(ID) {

    this.init = function() {
      this.mapContainer = document.getElementById(ID);

      // set fallback starting point for map
      this.fallbackStartLatLng = new google.maps.LatLng(34.024457, -118.445977);

      // create new map on global variable
      this.map = new google.maps.Map(this.mapContainer, {
        center: new google.maps.LatLng(0, 0),
        zoom: 2,
        scrollwheel: true,
        disableDefaultUI: false,
        mapTypeControl: false
      });

      this.activeMarkers = [];

      // pulled from google map docs
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          var initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          this.map.setCenter(initialLocation);
          this.map.setZoom(15);
        }.bind(this), function() {
          console.error("FAILED TO INIT GEOLOCATION SERVICE");
          this.map.setCenter(this.fallbackStartLatLng);
          this.map.setZoom(15);
        }.bind(this));
      } else {
        console.error("BROWSER DOESN'T SUPPORT GEO LOCATION");
        this.map.setCenter(this.fallbackStartLatLng);
        this.map.setZoom(15);
      }

      this.infoWindow = new InfoWindow(this.map);

    };

    this.generateMarker = function(place, map) {
      return (new google.maps.Marker({
        map: this.map,
        position: place.geometry.location,
        title: place.name
      }));
    };

    this.markerIsActive = function(place) {
      console.log('checking if marker exists for ', place, this.activeMarkers);
      for (var i = 0; i < this.activeMarkers.length; i++) {
        if (this.activeMarkers[i].place_id === place.place_id) return true;
      }
      return false;
    };

    this.placeMarker = function(place, map, setBy) {
      if (this.markerIsActive(place)) return;
      console.log('PLACING MARKER');
      var marker = this.generateMarker(place, map);
      marker.setBy = setBy;
      marker.place_id = place.place_id;
      // var infoPane = new infoWindow(this.map, place, marker);
      marker.addListener('click', function() {
        console.log('clicked marker ', marker, ' with place ', place);
        this.infoWindow.openPane(place, marker);
      }.bind(this));
      this.activeMarkers.push(marker);
    };

    this.setMapOnAll = function(map, filter) {
      filter = filter || function(item) {
        return true;
      };
      for (var i = 0; i < this.activeMarkers.length; i++) {
        if (filter(this.activeMarkers[i])) {
          this.activeMarkers[i].setMap(map);
        }
      }
    };

    this.clearMarkers = function(filter) {
      console.log('CLEARING MAKRERS');
      this.setMapOnAll(null, filter);
      this.activeMarkers = this.activeMarkers.reduce(function(cur, marker) {
        return (filter(marker)) ? cur : cur.concat(marker);
      }, []);
    };

    this.hideMarkers = function(filter) {
      this.setMapOnAll(null, filter);
    };

    this.showMarkers = function(filter) {
      this.setMapOnAll(this.map, filter);
    };

    this.plotSearchPlaces = function(res) {

      if (Object.prototype.toString.call(res) === '[object Object]') return this.placeMarker(res, this.map, 'SEARCH_SVC');

      res.forEach(function(place) {
        this.placeMarker(place, this.map, 'SEARCH_SVC');
      }.bind(this));


    };

    this.clearSearchPlaces = function() {
      console.log('clearing SEARCH_SVC places...');
      this.clearMarkers(function(marker) {
        return (marker.setBy === 'SEARCH_SVC') ? true : false;
      });
    };

    this.init();

  }


  function PrefetchResults(selector) {
    this.resultContainer = $(selector);
    this.loading = false;

    this.templates = {
      mainContainer: '<li place_id="{{PLACE_ID}}">{{PLACE_NAME}}</li>',
      noResults: '<li>No Results :/</li>'
    };

    this.toggleLoading = function() {
      this.resultContainer.children('li:first').toggleClass('hide');
      this.loading = !this.loading;
    };

    this.clear = function() {
      this.resultContainer.children().not('li:first').remove();
    };

    this.set = function(htmlToAdd) {
      this.resultContainer.append(htmlToAdd);
    };

    this.buildItem = function(place) {
      return (this.templates.mainContainer
        .replace('{{PLACE_ID}}', place.place_id)
        .replace('{{PLACE_NAME}}', place.name));
    };

    this.handleResultClick = function(evt, place) {
      if ($(evt.target).attr('place_id')) map.plotSearchPlaces(place);
    };

    this.generateResultClickHandler = function(place) {
      return (function(evt) {

        this.handleResultClick(evt, place);

      }.bind(this));
    };

    this.setResults = function(data) {
      console.log('setting prefetch items... ', data);
      if (data.length === 0) return this.set(this.templates.noResults);
      data.forEach(function(place) {
        var listItem = $(this.buildItem(place));
        listItem.on('click', this.generateResultClickHandler(place));
        this.set(listItem);
      }.bind(this));

    };


    this.fetch = function(keyword) {
      console.log('prefetching search results');
      // if (this.loading) return console.log('prefetch is already in progress');
      this.toggleLoading();
      searchServices.nearbySearch(keyword).then(function(data, status) {

        this.toggleLoading();
        this.clear();
        this.setResults(data);

      }.bind(this), function(err) {
        this.toggleLoading();
        this.setResults([]);
      }.bind(this));
    };

  }


  function notificationController(node) {

    this.requestContainer = $(node);
    this.reqCount = this.requestContainer.children().length - 1;

    this.removeItem = function(requestId) {
      var query = "li[request_id='{{REQ_ID}}']".replace('{{REQ_ID}}', requestId);
      this.requestContainer.children(query)[0].remove();
      this.reqCount--;

      if (this.reqCount === 0) this.toggleRequestVisibilty();
    };


    this.accept = function(friendId) {
      console.log('accepting ', friendId);

      userInterface.acceptRequest(friendId).then(function(msg) {

        console.log('success! ', msg);
        this.removeItem(friendId);

      }.bind(this), setMessage.setConsole);

    };


    this.reject = function(friendId) {
      console.log('rejecting ', friendId);

      userInterface.rejectRequest(friendId).then(function(msg) {

        console.log('success! ', msg);
        this.removeItem(friendId);

      }.bind(this), setMessage.setConsole);

    };

    this.toggleRequestVisibilty = function() {
      this.requestContainer.toggleClass('hide');
    };



  }


  function handleSearchSubmit(evt) {

    var searchTerm = searchTextBox.val();
    console.log('starting nearby search...');
    searchServices.nearbySearch(searchTerm).then(function(data) {
      console.log('... OK starting map ops...');
      map.clearSearchPlaces();
      map.plotSearchPlaces(data);
    }, setMessage.setConsole);

  }

  function handleSearchInput(evt) {

    if (evt.keyCode === 13) {
      console.log('search input RETURN, passing to submit');
      return handleSearchSubmit(evt);
    }

    var searchTerm = searchTextBox.val();

    if (searchTerm.length === 0) return prefetchResults.clear();
    if (searchTerm.length >= 4) return prefetchResults.fetch(searchTerm);

  }


  function handleRequestSubmit(evt) {

    if ((!evt.keyCode) || (evt.keyCode === 13)) {

      var friendUsername = $('.request--input').val();

      if (!friendUsername) return setMessage.setGeneric('#requestStatus', 'No Friend username?');

      var username = $('#username').text();

      if (username === friendUsername) return setMessage.setGeneric('#requestStatus', "Can't add urself :/");

      userInterface.sendRequest(friendUsername).then(function(msg) {
        setMessage.setGeneric('#requestStatus', 'Request sent :D');
      }, setMessage.setConsole);

    }

  }


  function handleMyPlaceFilter(evt) {
    map.plotMyPlaces();
  }

  function handleFriendPlaceFilter(evt) {
    map.plotFriendPlaces();
  }

  function handleOpenMail(evt) {

    notifications.toggleRequestVisibilty();

  }



  // *************NEEDS ATTENTION***************
  // - generator or use bubbling based on class
  // function handleReqAccept(evt) {
  //   notifications.accept(evt);
  // }

  // *************NEEDS ATTENTION***************
  // - generator or use bubbling based on class
  // function handleReqReject(evt) {
  //   notifications.reject(evt);
  // }

  function handleReqAction(evt) {

    var target = $(evt.target);
    console.log(target);

    if (target.hasClass('mail--btn')) {
      var friendId = $(target.parent()).attr('friend_id');
      if (target.hasClass('accept')) return notifications.accept(friendId);
      else return notifications.reject(friendId);

    }


  }

  function handleRemoveFriend(evt) {

    var friendId = $(evt.target).attr('friend_id');

    userInterface.removeFriend(friendId).then(function(msg) {
      console.log(msg);
    }, setMessage.setConsole);


  }

  // registers global event handlers
  function registerHandlers() {
    // search submit button => excecute search
    document.getElementById('placesSearchSubmit').addEventListener('click', handleSearchSubmit);
    document.getElementById('placeSearchInput').addEventListener('keyup', handleSearchInput);
    document.getElementById('addFriendInput').addEventListener('keyup', handleRequestSubmit);
    document.getElementById('addFriendSubmit').addEventListener('click', handleRequestSubmit);
    document.getElementById('filterMyPlaces').addEventListener('click', handleMyPlaceFilter);
    document.getElementById('filterFriendPlaces').addEventListener('click', handleFriendPlaceFilter);
    
    document.getElementById('openMail').addEventListener('click', handleOpenMail);
    document.getElementById('closeMail').addEventListener('click', handleOpenMail);
    document.getElementById('notifications').addEventListener('click', handleReqAction);


    // *************NEEDS ATTENTION***************
    $(".friend--remove--btn").click(handleRemoveFriend);
    // $(".mail--btn.accept").click(handleReqAccept);
    // $(".mail--btn.reject").click(handleReqReject);
  }

  initialize();

});
