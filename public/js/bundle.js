/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _stringify = __webpack_require__(1);

	var _stringify2 = _interopRequireDefault(_stringify);

	var _promise = __webpack_require__(4);

	var _promise2 = _interopRequireDefault(_promise);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	$(document).ready(function () {

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

	    this.setGeneric = function (selector, text) {
	      var node = $(selector);

	      node.text(text);
	      setTimeout(function () {
	        node.text('');
	      }, 5000);
	    };

	    this.setConsole = function (data) {
	      console.log(data);
	    };
	  }

	  function UserInterface() {

	    this.init = function () {
	      $.get('/user/getUser').success(function (data) {
	        console.log('got user', data);
	        this.user = data;
	      }.bind(this)).error(setMessage.setConsole);
	    };

	    this.hasPlace = function (place_id) {

	      for (var i = 0; i < this.user.ownedPlaces.length; i++) {
	        if (this.user.ownedPlaces[i].place_id === place_id) return true;
	      }

	      return false;
	    };

	    this.removePlace = function (placeId) {
	      delete this.user.ownedPlaces[placeId];
	    };

	    this.savePlace = function (place) {

	      return new _promise2.default(function (res, rej) {
	        console.log('user interface is saving ', place);

	        $.post('/user/addPlace', {
	          place: (0, _stringify2.default)(place)
	        }).success(function (data) {
	          this.user.ownedPlaces = data.ownedPlaces;
	          res(data);
	        }.bind(this)).error(function (err) {
	          rej(err);
	        });
	      }.bind(this));
	    };

	    this.removePlace = function (place) {

	      return new _promise2.default(function (res, rej) {
	        console.log('user interface is removing ', place);

	        $.post('/user/removePlace', {
	          place: (0, _stringify2.default)(place)
	        }).success(function (data) {
	          this.user.ownedPlaces = data.ownedPlaces;
	          res(data);
	        }.bind(this)).error(function (err) {
	          rej(err);
	        });
	      }.bind(this));
	    };

	    this.sendRequest = function (friendUsername) {

	      return new _promise2.default(function (res, rej) {

	        $.post('/user/addRequest', {
	          friendUsername: friendUsername
	        }).success(function (msg) {
	          res(msg);
	        }).error(function (err) {
	          rej(err);
	        });
	      });
	    };

	    this.getUserId = function () {
	      return this.user.id;
	    };

	    this.removeFriend = function (friendId) {

	      return new _promise2.default(function (res, rej) {

	        $.post('/user/removeFriend', {
	          friendId: friendId
	        }).success(function (msg) {
	          res(msg);
	        }).error(function (err) {
	          rej(err);
	        });
	      });
	    };

	    this.acceptRequest = function (friendId) {

	      return new _promise2.default(function (res, rej) {

	        $.post('/user/acceptRequest', {
	          friendId: friendId
	        }).success(function (msg) {
	          res(msg);
	        }).error(function (err) {
	          rej(err);
	        });
	      });
	    };

	    this.rejectRequest = function (friendId) {
	      return new _promise2.default(function (res, rej) {

	        $.post('/user/removeRequest', {
	          friendId: friendId
	        }).success(function (msg) {
	          res(msg);
	        }).error(function (err) {
	          rej(err);
	        });
	      });
	    };

	    this.getOwnedPlaces = function () {
	      return this.user.ownedPlaces;
	    };

	    this.getFriendPlaces = function () {
	      return this.user.friendsPlaces;
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
	    this.buildSearchRequest = function (keyword) {
	      var lat = this.map.getCenter().lat();
	      var lng = this.map.getCenter().lng();
	      console.log(lat, lng);
	      return {
	        location: new google.maps.LatLng(lat, lng),
	        radius: '1200',
	        keyword: keyword
	      };
	    };

	    // executes a nearby search + calls the callback provided
	    this.nearbySearch = function (keyword) {

	      var req = this.buildSearchRequest(keyword);
	      return new _promise2.default(function (res, rej) {
	        this.placeServiceConn.nearbySearch(req, function (data, status) {
	          console.log('search results :', data, status);
	          if (status === google.maps.places.PlacesServiceStatus.OK || status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
	            res(data);
	          } else {
	            rej(data);
	          }
	        });
	      }.bind(this));
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

	    this.buildActionButton = function (place) {
	      // WHERE SHOULD THIS CHECK BE? Should a 'savedPlace' flag be set on 'place'? Should 'marker' be passed with a flag?
	      if (userInterface.hasPlace(place.place_id)) {
	        return this.templates.actionBtn.remove.replace('{{BTN_CLASS_MAIN}}', this.classes.actionBtn.main).replace('{{BTN_CLASS_ACTION}}', this.classes.actionBtn.remove);
	      } else {
	        return this.templates.actionBtn.save.replace('{{BTN_CLASS_MAIN}}', this.classes.actionBtn.main).replace('{{BTN_CLASS_ACTION}}', this.classes.actionBtn.save);
	      }
	    };

	    this.buildInfoWindow = function (place) {

	      var button = this.buildActionButton(place);

	      var contentString = this.templates.mainContainer.replace("{{ACTION_BTN}}", button).replace("{{PLACE_NAME}}", place.name).replace("{{PLACE_ID}}", place.place_id);

	      return contentString;
	    };

	    this.refreshActionButton = function (node, place) {
	      var btn = $(this.buildActionButton(place));
	      btn.on('click', this.generateActionClickHandler(place));
	      node.replaceWith(btn);
	    };

	    this.handleActionClick = function (evt, place) {

	      console.log('action button clicked ', evt);
	      var node = $(evt.target);
	      var place_id = node.attr('place_id');
	      if (node.hasClass('save')) {
	        userInterface.savePlace(place).then(function (msg) {

	          this.refreshActionButton(node, place);

	          console.log('success! place saved!', msg);
	        }.bind(this), setMessage.setConsole);
	      } else {

	        userInterface.removePlace(place).then(function (msg) {

	          this.refreshActionButton(node, place);

	          console.log('success! place removed!', msg);
	        }.bind(this), setMessage.setConsole);
	      }
	    };

	    this.generateActionClickHandler = function (place) {
	      return function (evt) {

	        this.handleActionClick(evt, place);
	      }.bind(this);
	    };

	    this.createHandler = function (place) {

	      console.log('configuring click handler...');

	      return function () {
	        var query = '.' + this.classes.actionBtn.main + "[place_id='" + place.place_id + "']";
	        var node = $(query);
	        $(node).on('click', this.generateActionClickHandler(place));
	      }.bind(this);
	    };

	    // rather have this just take 'position' instead of 'marker' object?
	    this.openPane = function (place, marker) {

	      if (this.open && this.lastOpen == place.place_id) return this.closePane();

	      console.log('Opening pane');

	      var content = this.buildInfoWindow(place);

	      this.pane.setContent(content);
	      this.pane.open(this.map, marker);
	      google.maps.event.addListener(this.pane, 'domready', this.createHandler(place));

	      this.lastOpen = place.place_id;
	      this.open = true;

	      console.log(this.pane);
	    };

	    this.closePane = function () {
	      this.open = false;
	      this.pane.close();
	    };
	  }

	  function MapArea(ID) {

	    this.init = function () {
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
	        navigator.geolocation.getCurrentPosition(function (position) {
	          var initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
	          this.map.setCenter(initialLocation);
	          this.map.setZoom(15);
	        }.bind(this), function () {
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

	    this.generateMarker = function (place, map) {
	      return new google.maps.Marker({
	        map: this.map,
	        position: place.geometry.location,
	        title: place.name
	      });
	    };

	    this.markerIsActive = function (place) {
	      console.log('checking if marker exists for ', place, this.activeMarkers);
	      for (var i = 0; i < this.activeMarkers.length; i++) {
	        if (this.activeMarkers[i].place_id === place.place_id) return true;
	      }
	      return false;
	    };

	    this.placeMarker = function (place, map, setBy) {
	      if (this.markerIsActive(place)) return;
	      console.log('PLACING MARKER');
	      var marker = this.generateMarker(place, map);

	      // should this be here?
	      marker.setBy = setBy;
	      marker.place_id = place.place_id;
	      marker.savedBy = place.savedBy;

	      marker.addListener('click', function () {
	        console.log('clicked marker ', marker, ' with place ', place);
	        this.infoWindow.openPane(place, marker);
	      }.bind(this));
	      this.activeMarkers.push(marker);
	    };

	    this.setMapOnAll = function (map, filter) {
	      filter = filter || function (item) {
	        return true;
	      };
	      for (var i = 0; i < this.activeMarkers.length; i++) {
	        if (filter(this.activeMarkers[i])) {
	          this.activeMarkers[i].setMap(map);
	        }
	      }
	    };

	    this.clearMarkers = function (filter) {
	      console.log('CLEARING MAKRERS');
	      this.setMapOnAll(null, filter);
	      this.activeMarkers = this.activeMarkers.reduce(function (cur, marker) {
	        return filter(marker) ? cur : cur.concat(marker);
	      }, []);
	    };

	    this.hideMarkers = function (filter) {
	      this.setMapOnAll(null, filter);
	    };

	    this.showMarkers = function (filter) {
	      this.setMapOnAll(this.map, filter);
	    };

	    this.plotSearchPlaces = function (res) {

	      this.plotPlaces(res, 'SEARCH_SVC');
	    };

	    this.plotPlaces = function (places, setBy) {

	      if (Object.prototype.toString.call(places) === '[object Object]') return this.placeMarker(places, this.map, setBy);

	      places.forEach(function (place) {
	        this.placeMarker(place, this.map, setBy);
	      }.bind(this));
	    };

	    this.clearSearchPlaces = function () {
	      console.log('clearing SEARCH_SVC places...');
	      this.clearMarkers(function (marker) {
	        return marker.setBy === 'SEARCH_SVC' ? true : false;
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

	    this.toggleLoading = function () {
	      this.resultContainer.children('li:first').toggleClass('hide');
	      this.loading = !this.loading;
	    };

	    this.clear = function () {
	      this.resultContainer.children().not('li:first').remove();
	    };

	    this.set = function (htmlToAdd) {
	      this.resultContainer.append(htmlToAdd);
	    };

	    this.buildItem = function (place) {
	      return this.templates.mainContainer.replace('{{PLACE_ID}}', place.place_id).replace('{{PLACE_NAME}}', place.name);
	    };

	    this.handleResultClick = function (evt, place) {
	      if ($(evt.target).attr('place_id')) map.plotSearchPlaces(place);
	    };

	    this.generateResultClickHandler = function (place) {
	      return function (evt) {

	        this.handleResultClick(evt, place);
	      }.bind(this);
	    };

	    this.setResults = function (data) {
	      console.log('setting prefetch items... ', data);
	      if (data.length === 0) return this.set(this.templates.noResults);
	      data.forEach(function (place) {
	        var listItem = $(this.buildItem(place));
	        listItem.on('click', this.generateResultClickHandler(place));
	        this.set(listItem);
	      }.bind(this));
	    };

	    this.fetch = function (keyword) {
	      console.log('prefetching search results');
	      // if (this.loading) return console.log('prefetch is already in progress');
	      this.toggleLoading();
	      searchServices.nearbySearch(keyword).then(function (data, status) {

	        this.toggleLoading();
	        this.clear();
	        this.setResults(data);
	      }.bind(this), function (err) {
	        this.toggleLoading();
	        this.setResults([]);
	      }.bind(this));
	    };
	  }

	  function notificationController(node) {

	    this.requestContainer = $(node);
	    this.reqCount = this.requestContainer.children().length - 1;

	    this.removeItem = function (requestId) {
	      var query = "li[request_id='{{REQ_ID}}']".replace('{{REQ_ID}}', requestId);
	      this.requestContainer.children(query)[0].remove();
	      this.reqCount--;

	      if (this.reqCount === 0) this.toggleRequestVisibilty();
	    };

	    this.accept = function (friendId) {
	      console.log('accepting ', friendId);

	      userInterface.acceptRequest(friendId).then(function (msg) {

	        console.log('success! ', msg);
	        this.removeItem(friendId);
	      }.bind(this), setMessage.setConsole);
	    };

	    this.reject = function (friendId) {
	      console.log('rejecting ', friendId);

	      userInterface.rejectRequest(friendId).then(function (msg) {

	        console.log('success! ', msg);
	        this.removeItem(friendId);
	      }.bind(this), setMessage.setConsole);
	    };

	    this.toggleRequestVisibilty = function () {
	      this.requestContainer.toggleClass('hide');
	    };
	  }

	  function handleSearchSubmit(evt) {

	    var searchTerm = searchTextBox.val();
	    console.log('starting nearby search...');
	    searchServices.nearbySearch(searchTerm).then(function (data) {
	      console.log('... OK starting map ops...');
	      map.clearSearchPlaces();
	      map.plotPlaces(data, 'SEARCH_SVC');
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

	    if (!evt.keyCode || evt.keyCode === 13) {

	      var friendUsername = $('.request--input').val();

	      if (!friendUsername) return setMessage.setGeneric('#requestStatus', 'No Friend username?');

	      var username = $('#username').text();

	      if (username === friendUsername) return setMessage.setGeneric('#requestStatus', "Can't add urself :/");

	      userInterface.sendRequest(friendUsername).then(function (msg) {
	        setMessage.setGeneric('#requestStatus', 'Request sent :D');
	      }, function (err) {
	        console.log(err);
	        setMessage.setGeneric('#requestStatus', err.responseJSON.message);
	      });
	    }
	  }

	  function handleMyPlaceFilter(evt) {

	    var filterBtn = $(evt.target);
	    if (filterBtn.hasClass('active')) {
	      map.clearMarkers(function (marker) {
	        return marker.setBy === 'USER_FLTR' ? true : false;
	      });
	    } else {
	      map.plotPlaces(userInterface.getOwnedPlaces(), 'USER_FLTR');
	    }

	    filterBtn.toggleClass('active');
	  }

	  function handleFriendPlaceFilter(evt) {

	    var filterBtn = $(evt.target);
	    if (filterBtn.hasClass('active')) {
	      map.clearMarkers(function (marker) {
	        return marker.setBy === 'FRIEND_FLTR' ? true : false;
	      });
	    } else {
	      map.plotPlaces(userInterface.getFriendPlaces(), 'FRIEND_FLTR');
	    }

	    filterBtn.toggleClass('active');
	  }

	  function handleOpenMail(evt) {

	    notifications.toggleRequestVisibilty();
	  }

	  function handleReqAction(evt) {

	    var target = $(evt.target);
	    console.log(target);

	    if (target.hasClass('mail--btn')) {
	      var friendId = $(target.parent()).attr('friend_id');
	      if (target.hasClass('accept')) return notifications.accept(friendId);else return notifications.reject(friendId);
	    }
	  }

	  function handleRemoveFriend(evt) {

	    var target = $(evt.target);
	    var friendId = target.attr('friend_id');

	    userInterface.removeFriend(friendId).then(function (msg) {

	      target.parent('');
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

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(2), __esModule: true };

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var core = __webpack_require__(3);
	module.exports = function stringify(it){ // eslint-disable-line no-unused-vars
	  return (core.JSON && core.JSON.stringify || JSON.stringify).apply(JSON, arguments);
	};

/***/ },
/* 3 */
/***/ function(module, exports) {

	var core = module.exports = {version: '1.2.6'};
	if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(5), __esModule: true };

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(6);
	__webpack_require__(7);
	__webpack_require__(30);
	__webpack_require__(37);
	module.exports = __webpack_require__(3).Promise;

/***/ },
/* 6 */
/***/ function(module, exports) {

	

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $at  = __webpack_require__(8)(true);

	// 21.1.3.27 String.prototype[@@iterator]()
	__webpack_require__(11)(String, 'String', function(iterated){
	  this._t = String(iterated); // target
	  this._i = 0;                // next index
	// 21.1.5.2.1 %StringIteratorPrototype%.next()
	}, function(){
	  var O     = this._t
	    , index = this._i
	    , point;
	  if(index >= O.length)return {value: undefined, done: true};
	  point = $at(O, index);
	  this._i += point.length;
	  return {value: point, done: false};
	});

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var toInteger = __webpack_require__(9)
	  , defined   = __webpack_require__(10);
	// true  -> String#at
	// false -> String#codePointAt
	module.exports = function(TO_STRING){
	  return function(that, pos){
	    var s = String(defined(that))
	      , i = toInteger(pos)
	      , l = s.length
	      , a, b;
	    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
	    a = s.charCodeAt(i);
	    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
	      ? TO_STRING ? s.charAt(i) : a
	      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
	  };
	};

/***/ },
/* 9 */
/***/ function(module, exports) {

	// 7.1.4 ToInteger
	var ceil  = Math.ceil
	  , floor = Math.floor;
	module.exports = function(it){
	  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
	};

/***/ },
/* 10 */
/***/ function(module, exports) {

	// 7.2.1 RequireObjectCoercible(argument)
	module.exports = function(it){
	  if(it == undefined)throw TypeError("Can't call method on  " + it);
	  return it;
	};

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var LIBRARY        = __webpack_require__(12)
	  , $export        = __webpack_require__(13)
	  , redefine       = __webpack_require__(17)
	  , hide           = __webpack_require__(18)
	  , has            = __webpack_require__(23)
	  , Iterators      = __webpack_require__(24)
	  , $iterCreate    = __webpack_require__(25)
	  , setToStringTag = __webpack_require__(26)
	  , getProto       = __webpack_require__(19).getProto
	  , ITERATOR       = __webpack_require__(27)('iterator')
	  , BUGGY          = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
	  , FF_ITERATOR    = '@@iterator'
	  , KEYS           = 'keys'
	  , VALUES         = 'values';

	var returnThis = function(){ return this; };

	module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED){
	  $iterCreate(Constructor, NAME, next);
	  var getMethod = function(kind){
	    if(!BUGGY && kind in proto)return proto[kind];
	    switch(kind){
	      case KEYS: return function keys(){ return new Constructor(this, kind); };
	      case VALUES: return function values(){ return new Constructor(this, kind); };
	    } return function entries(){ return new Constructor(this, kind); };
	  };
	  var TAG        = NAME + ' Iterator'
	    , DEF_VALUES = DEFAULT == VALUES
	    , VALUES_BUG = false
	    , proto      = Base.prototype
	    , $native    = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
	    , $default   = $native || getMethod(DEFAULT)
	    , methods, key;
	  // Fix native
	  if($native){
	    var IteratorPrototype = getProto($default.call(new Base));
	    // Set @@toStringTag to native iterators
	    setToStringTag(IteratorPrototype, TAG, true);
	    // FF fix
	    if(!LIBRARY && has(proto, FF_ITERATOR))hide(IteratorPrototype, ITERATOR, returnThis);
	    // fix Array#{values, @@iterator}.name in V8 / FF
	    if(DEF_VALUES && $native.name !== VALUES){
	      VALUES_BUG = true;
	      $default = function values(){ return $native.call(this); };
	    }
	  }
	  // Define iterator
	  if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){
	    hide(proto, ITERATOR, $default);
	  }
	  // Plug for library
	  Iterators[NAME] = $default;
	  Iterators[TAG]  = returnThis;
	  if(DEFAULT){
	    methods = {
	      values:  DEF_VALUES  ? $default : getMethod(VALUES),
	      keys:    IS_SET      ? $default : getMethod(KEYS),
	      entries: !DEF_VALUES ? $default : getMethod('entries')
	    };
	    if(FORCED)for(key in methods){
	      if(!(key in proto))redefine(proto, key, methods[key]);
	    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
	  }
	  return methods;
	};

/***/ },
/* 12 */
/***/ function(module, exports) {

	module.exports = true;

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var global    = __webpack_require__(14)
	  , core      = __webpack_require__(3)
	  , ctx       = __webpack_require__(15)
	  , PROTOTYPE = 'prototype';

	var $export = function(type, name, source){
	  var IS_FORCED = type & $export.F
	    , IS_GLOBAL = type & $export.G
	    , IS_STATIC = type & $export.S
	    , IS_PROTO  = type & $export.P
	    , IS_BIND   = type & $export.B
	    , IS_WRAP   = type & $export.W
	    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
	    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE]
	    , key, own, out;
	  if(IS_GLOBAL)source = name;
	  for(key in source){
	    // contains in native
	    own = !IS_FORCED && target && key in target;
	    if(own && key in exports)continue;
	    // export native or passed
	    out = own ? target[key] : source[key];
	    // prevent global pollution for namespaces
	    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
	    // bind timers to global for call from export context
	    : IS_BIND && own ? ctx(out, global)
	    // wrap global constructors for prevent change them in library
	    : IS_WRAP && target[key] == out ? (function(C){
	      var F = function(param){
	        return this instanceof C ? new C(param) : C(param);
	      };
	      F[PROTOTYPE] = C[PROTOTYPE];
	      return F;
	    // make static versions for prototype methods
	    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
	    if(IS_PROTO)(exports[PROTOTYPE] || (exports[PROTOTYPE] = {}))[key] = out;
	  }
	};
	// type bitmap
	$export.F = 1;  // forced
	$export.G = 2;  // global
	$export.S = 4;  // static
	$export.P = 8;  // proto
	$export.B = 16; // bind
	$export.W = 32; // wrap
	module.exports = $export;

/***/ },
/* 14 */
/***/ function(module, exports) {

	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var global = module.exports = typeof window != 'undefined' && window.Math == Math
	  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
	if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	// optional / simple context binding
	var aFunction = __webpack_require__(16);
	module.exports = function(fn, that, length){
	  aFunction(fn);
	  if(that === undefined)return fn;
	  switch(length){
	    case 1: return function(a){
	      return fn.call(that, a);
	    };
	    case 2: return function(a, b){
	      return fn.call(that, a, b);
	    };
	    case 3: return function(a, b, c){
	      return fn.call(that, a, b, c);
	    };
	  }
	  return function(/* ...args */){
	    return fn.apply(that, arguments);
	  };
	};

/***/ },
/* 16 */
/***/ function(module, exports) {

	module.exports = function(it){
	  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
	  return it;
	};

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(18);

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	var $          = __webpack_require__(19)
	  , createDesc = __webpack_require__(20);
	module.exports = __webpack_require__(21) ? function(object, key, value){
	  return $.setDesc(object, key, createDesc(1, value));
	} : function(object, key, value){
	  object[key] = value;
	  return object;
	};

/***/ },
/* 19 */
/***/ function(module, exports) {

	var $Object = Object;
	module.exports = {
	  create:     $Object.create,
	  getProto:   $Object.getPrototypeOf,
	  isEnum:     {}.propertyIsEnumerable,
	  getDesc:    $Object.getOwnPropertyDescriptor,
	  setDesc:    $Object.defineProperty,
	  setDescs:   $Object.defineProperties,
	  getKeys:    $Object.keys,
	  getNames:   $Object.getOwnPropertyNames,
	  getSymbols: $Object.getOwnPropertySymbols,
	  each:       [].forEach
	};

/***/ },
/* 20 */
/***/ function(module, exports) {

	module.exports = function(bitmap, value){
	  return {
	    enumerable  : !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable    : !(bitmap & 4),
	    value       : value
	  };
	};

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	// Thank's IE8 for his funny defineProperty
	module.exports = !__webpack_require__(22)(function(){
	  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
	});

/***/ },
/* 22 */
/***/ function(module, exports) {

	module.exports = function(exec){
	  try {
	    return !!exec();
	  } catch(e){
	    return true;
	  }
	};

/***/ },
/* 23 */
/***/ function(module, exports) {

	var hasOwnProperty = {}.hasOwnProperty;
	module.exports = function(it, key){
	  return hasOwnProperty.call(it, key);
	};

/***/ },
/* 24 */
/***/ function(module, exports) {

	module.exports = {};

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $              = __webpack_require__(19)
	  , descriptor     = __webpack_require__(20)
	  , setToStringTag = __webpack_require__(26)
	  , IteratorPrototype = {};

	// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
	__webpack_require__(18)(IteratorPrototype, __webpack_require__(27)('iterator'), function(){ return this; });

	module.exports = function(Constructor, NAME, next){
	  Constructor.prototype = $.create(IteratorPrototype, {next: descriptor(1, next)});
	  setToStringTag(Constructor, NAME + ' Iterator');
	};

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	var def = __webpack_require__(19).setDesc
	  , has = __webpack_require__(23)
	  , TAG = __webpack_require__(27)('toStringTag');

	module.exports = function(it, tag, stat){
	  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
	};

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	var store  = __webpack_require__(28)('wks')
	  , uid    = __webpack_require__(29)
	  , Symbol = __webpack_require__(14).Symbol;
	module.exports = function(name){
	  return store[name] || (store[name] =
	    Symbol && Symbol[name] || (Symbol || uid)('Symbol.' + name));
	};

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	var global = __webpack_require__(14)
	  , SHARED = '__core-js_shared__'
	  , store  = global[SHARED] || (global[SHARED] = {});
	module.exports = function(key){
	  return store[key] || (store[key] = {});
	};

/***/ },
/* 29 */
/***/ function(module, exports) {

	var id = 0
	  , px = Math.random();
	module.exports = function(key){
	  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
	};

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(31);
	var Iterators = __webpack_require__(24);
	Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var addToUnscopables = __webpack_require__(32)
	  , step             = __webpack_require__(33)
	  , Iterators        = __webpack_require__(24)
	  , toIObject        = __webpack_require__(34);

	// 22.1.3.4 Array.prototype.entries()
	// 22.1.3.13 Array.prototype.keys()
	// 22.1.3.29 Array.prototype.values()
	// 22.1.3.30 Array.prototype[@@iterator]()
	module.exports = __webpack_require__(11)(Array, 'Array', function(iterated, kind){
	  this._t = toIObject(iterated); // target
	  this._i = 0;                   // next index
	  this._k = kind;                // kind
	// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
	}, function(){
	  var O     = this._t
	    , kind  = this._k
	    , index = this._i++;
	  if(!O || index >= O.length){
	    this._t = undefined;
	    return step(1);
	  }
	  if(kind == 'keys'  )return step(0, index);
	  if(kind == 'values')return step(0, O[index]);
	  return step(0, [index, O[index]]);
	}, 'values');

	// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
	Iterators.Arguments = Iterators.Array;

	addToUnscopables('keys');
	addToUnscopables('values');
	addToUnscopables('entries');

/***/ },
/* 32 */
/***/ function(module, exports) {

	module.exports = function(){ /* empty */ };

/***/ },
/* 33 */
/***/ function(module, exports) {

	module.exports = function(done, value){
	  return {value: value, done: !!done};
	};

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	// to indexed object, toObject with fallback for non-array-like ES3 strings
	var IObject = __webpack_require__(35)
	  , defined = __webpack_require__(10);
	module.exports = function(it){
	  return IObject(defined(it));
	};

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	// fallback for non-array-like ES3 and non-enumerable old V8 strings
	var cof = __webpack_require__(36);
	module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
	  return cof(it) == 'String' ? it.split('') : Object(it);
	};

/***/ },
/* 36 */
/***/ function(module, exports) {

	var toString = {}.toString;

	module.exports = function(it){
	  return toString.call(it).slice(8, -1);
	};

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $          = __webpack_require__(19)
	  , LIBRARY    = __webpack_require__(12)
	  , global     = __webpack_require__(14)
	  , ctx        = __webpack_require__(15)
	  , classof    = __webpack_require__(38)
	  , $export    = __webpack_require__(13)
	  , isObject   = __webpack_require__(39)
	  , anObject   = __webpack_require__(40)
	  , aFunction  = __webpack_require__(16)
	  , strictNew  = __webpack_require__(41)
	  , forOf      = __webpack_require__(42)
	  , setProto   = __webpack_require__(47).set
	  , same       = __webpack_require__(48)
	  , SPECIES    = __webpack_require__(27)('species')
	  , speciesConstructor = __webpack_require__(49)
	  , asap       = __webpack_require__(50)
	  , PROMISE    = 'Promise'
	  , process    = global.process
	  , isNode     = classof(process) == 'process'
	  , P          = global[PROMISE]
	  , Wrapper;

	var testResolve = function(sub){
	  var test = new P(function(){});
	  if(sub)test.constructor = Object;
	  return P.resolve(test) === test;
	};

	var USE_NATIVE = function(){
	  var works = false;
	  function P2(x){
	    var self = new P(x);
	    setProto(self, P2.prototype);
	    return self;
	  }
	  try {
	    works = P && P.resolve && testResolve();
	    setProto(P2, P);
	    P2.prototype = $.create(P.prototype, {constructor: {value: P2}});
	    // actual Firefox has broken subclass support, test that
	    if(!(P2.resolve(5).then(function(){}) instanceof P2)){
	      works = false;
	    }
	    // actual V8 bug, https://code.google.com/p/v8/issues/detail?id=4162
	    if(works && __webpack_require__(21)){
	      var thenableThenGotten = false;
	      P.resolve($.setDesc({}, 'then', {
	        get: function(){ thenableThenGotten = true; }
	      }));
	      works = thenableThenGotten;
	    }
	  } catch(e){ works = false; }
	  return works;
	}();

	// helpers
	var sameConstructor = function(a, b){
	  // library wrapper special case
	  if(LIBRARY && a === P && b === Wrapper)return true;
	  return same(a, b);
	};
	var getConstructor = function(C){
	  var S = anObject(C)[SPECIES];
	  return S != undefined ? S : C;
	};
	var isThenable = function(it){
	  var then;
	  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
	};
	var PromiseCapability = function(C){
	  var resolve, reject;
	  this.promise = new C(function($$resolve, $$reject){
	    if(resolve !== undefined || reject !== undefined)throw TypeError('Bad Promise constructor');
	    resolve = $$resolve;
	    reject  = $$reject;
	  });
	  this.resolve = aFunction(resolve),
	  this.reject  = aFunction(reject)
	};
	var perform = function(exec){
	  try {
	    exec();
	  } catch(e){
	    return {error: e};
	  }
	};
	var notify = function(record, isReject){
	  if(record.n)return;
	  record.n = true;
	  var chain = record.c;
	  asap(function(){
	    var value = record.v
	      , ok    = record.s == 1
	      , i     = 0;
	    var run = function(reaction){
	      var handler = ok ? reaction.ok : reaction.fail
	        , resolve = reaction.resolve
	        , reject  = reaction.reject
	        , result, then;
	      try {
	        if(handler){
	          if(!ok)record.h = true;
	          result = handler === true ? value : handler(value);
	          if(result === reaction.promise){
	            reject(TypeError('Promise-chain cycle'));
	          } else if(then = isThenable(result)){
	            then.call(result, resolve, reject);
	          } else resolve(result);
	        } else reject(value);
	      } catch(e){
	        reject(e);
	      }
	    };
	    while(chain.length > i)run(chain[i++]); // variable length - can't use forEach
	    chain.length = 0;
	    record.n = false;
	    if(isReject)setTimeout(function(){
	      var promise = record.p
	        , handler, console;
	      if(isUnhandled(promise)){
	        if(isNode){
	          process.emit('unhandledRejection', value, promise);
	        } else if(handler = global.onunhandledrejection){
	          handler({promise: promise, reason: value});
	        } else if((console = global.console) && console.error){
	          console.error('Unhandled promise rejection', value);
	        }
	      } record.a = undefined;
	    }, 1);
	  });
	};
	var isUnhandled = function(promise){
	  var record = promise._d
	    , chain  = record.a || record.c
	    , i      = 0
	    , reaction;
	  if(record.h)return false;
	  while(chain.length > i){
	    reaction = chain[i++];
	    if(reaction.fail || !isUnhandled(reaction.promise))return false;
	  } return true;
	};
	var $reject = function(value){
	  var record = this;
	  if(record.d)return;
	  record.d = true;
	  record = record.r || record; // unwrap
	  record.v = value;
	  record.s = 2;
	  record.a = record.c.slice();
	  notify(record, true);
	};
	var $resolve = function(value){
	  var record = this
	    , then;
	  if(record.d)return;
	  record.d = true;
	  record = record.r || record; // unwrap
	  try {
	    if(record.p === value)throw TypeError("Promise can't be resolved itself");
	    if(then = isThenable(value)){
	      asap(function(){
	        var wrapper = {r: record, d: false}; // wrap
	        try {
	          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
	        } catch(e){
	          $reject.call(wrapper, e);
	        }
	      });
	    } else {
	      record.v = value;
	      record.s = 1;
	      notify(record, false);
	    }
	  } catch(e){
	    $reject.call({r: record, d: false}, e); // wrap
	  }
	};

	// constructor polyfill
	if(!USE_NATIVE){
	  // 25.4.3.1 Promise(executor)
	  P = function Promise(executor){
	    aFunction(executor);
	    var record = this._d = {
	      p: strictNew(this, P, PROMISE),         // <- promise
	      c: [],                                  // <- awaiting reactions
	      a: undefined,                           // <- checked in isUnhandled reactions
	      s: 0,                                   // <- state
	      d: false,                               // <- done
	      v: undefined,                           // <- value
	      h: false,                               // <- handled rejection
	      n: false                                // <- notify
	    };
	    try {
	      executor(ctx($resolve, record, 1), ctx($reject, record, 1));
	    } catch(err){
	      $reject.call(record, err);
	    }
	  };
	  __webpack_require__(55)(P.prototype, {
	    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
	    then: function then(onFulfilled, onRejected){
	      var reaction = new PromiseCapability(speciesConstructor(this, P))
	        , promise  = reaction.promise
	        , record   = this._d;
	      reaction.ok   = typeof onFulfilled == 'function' ? onFulfilled : true;
	      reaction.fail = typeof onRejected == 'function' && onRejected;
	      record.c.push(reaction);
	      if(record.a)record.a.push(reaction);
	      if(record.s)notify(record, false);
	      return promise;
	    },
	    // 25.4.5.1 Promise.prototype.catch(onRejected)
	    'catch': function(onRejected){
	      return this.then(undefined, onRejected);
	    }
	  });
	}

	$export($export.G + $export.W + $export.F * !USE_NATIVE, {Promise: P});
	__webpack_require__(26)(P, PROMISE);
	__webpack_require__(56)(PROMISE);
	Wrapper = __webpack_require__(3)[PROMISE];

	// statics
	$export($export.S + $export.F * !USE_NATIVE, PROMISE, {
	  // 25.4.4.5 Promise.reject(r)
	  reject: function reject(r){
	    var capability = new PromiseCapability(this)
	      , $$reject   = capability.reject;
	    $$reject(r);
	    return capability.promise;
	  }
	});
	$export($export.S + $export.F * (!USE_NATIVE || testResolve(true)), PROMISE, {
	  // 25.4.4.6 Promise.resolve(x)
	  resolve: function resolve(x){
	    // instanceof instead of internal slot check because we should fix it without replacement native Promise core
	    if(x instanceof P && sameConstructor(x.constructor, this))return x;
	    var capability = new PromiseCapability(this)
	      , $$resolve  = capability.resolve;
	    $$resolve(x);
	    return capability.promise;
	  }
	});
	$export($export.S + $export.F * !(USE_NATIVE && __webpack_require__(57)(function(iter){
	  P.all(iter)['catch'](function(){});
	})), PROMISE, {
	  // 25.4.4.1 Promise.all(iterable)
	  all: function all(iterable){
	    var C          = getConstructor(this)
	      , capability = new PromiseCapability(C)
	      , resolve    = capability.resolve
	      , reject     = capability.reject
	      , values     = [];
	    var abrupt = perform(function(){
	      forOf(iterable, false, values.push, values);
	      var remaining = values.length
	        , results   = Array(remaining);
	      if(remaining)$.each.call(values, function(promise, index){
	        var alreadyCalled = false;
	        C.resolve(promise).then(function(value){
	          if(alreadyCalled)return;
	          alreadyCalled = true;
	          results[index] = value;
	          --remaining || resolve(results);
	        }, reject);
	      });
	      else resolve(results);
	    });
	    if(abrupt)reject(abrupt.error);
	    return capability.promise;
	  },
	  // 25.4.4.4 Promise.race(iterable)
	  race: function race(iterable){
	    var C          = getConstructor(this)
	      , capability = new PromiseCapability(C)
	      , reject     = capability.reject;
	    var abrupt = perform(function(){
	      forOf(iterable, false, function(promise){
	        C.resolve(promise).then(capability.resolve, reject);
	      });
	    });
	    if(abrupt)reject(abrupt.error);
	    return capability.promise;
	  }
	});

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	// getting tag from 19.1.3.6 Object.prototype.toString()
	var cof = __webpack_require__(36)
	  , TAG = __webpack_require__(27)('toStringTag')
	  // ES3 wrong here
	  , ARG = cof(function(){ return arguments; }()) == 'Arguments';

	module.exports = function(it){
	  var O, T, B;
	  return it === undefined ? 'Undefined' : it === null ? 'Null'
	    // @@toStringTag case
	    : typeof (T = (O = Object(it))[TAG]) == 'string' ? T
	    // builtinTag case
	    : ARG ? cof(O)
	    // ES3 arguments fallback
	    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
	};

/***/ },
/* 39 */
/***/ function(module, exports) {

	module.exports = function(it){
	  return typeof it === 'object' ? it !== null : typeof it === 'function';
	};

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(39);
	module.exports = function(it){
	  if(!isObject(it))throw TypeError(it + ' is not an object!');
	  return it;
	};

/***/ },
/* 41 */
/***/ function(module, exports) {

	module.exports = function(it, Constructor, name){
	  if(!(it instanceof Constructor))throw TypeError(name + ": use the 'new' operator!");
	  return it;
	};

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	var ctx         = __webpack_require__(15)
	  , call        = __webpack_require__(43)
	  , isArrayIter = __webpack_require__(44)
	  , anObject    = __webpack_require__(40)
	  , toLength    = __webpack_require__(45)
	  , getIterFn   = __webpack_require__(46);
	module.exports = function(iterable, entries, fn, that){
	  var iterFn = getIterFn(iterable)
	    , f      = ctx(fn, that, entries ? 2 : 1)
	    , index  = 0
	    , length, step, iterator;
	  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
	  // fast case for arrays with default iterator
	  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
	    entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
	  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
	    call(iterator, f, step.value, entries);
	  }
	};

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	// call something on iterator step with safe closing on error
	var anObject = __webpack_require__(40);
	module.exports = function(iterator, fn, value, entries){
	  try {
	    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
	  // 7.4.6 IteratorClose(iterator, completion)
	  } catch(e){
	    var ret = iterator['return'];
	    if(ret !== undefined)anObject(ret.call(iterator));
	    throw e;
	  }
	};

/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	// check on default Array iterator
	var Iterators  = __webpack_require__(24)
	  , ITERATOR   = __webpack_require__(27)('iterator')
	  , ArrayProto = Array.prototype;

	module.exports = function(it){
	  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
	};

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.15 ToLength
	var toInteger = __webpack_require__(9)
	  , min       = Math.min;
	module.exports = function(it){
	  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
	};

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	var classof   = __webpack_require__(38)
	  , ITERATOR  = __webpack_require__(27)('iterator')
	  , Iterators = __webpack_require__(24);
	module.exports = __webpack_require__(3).getIteratorMethod = function(it){
	  if(it != undefined)return it[ITERATOR]
	    || it['@@iterator']
	    || Iterators[classof(it)];
	};

/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	// Works with __proto__ only. Old v8 can't work with null proto objects.
	/* eslint-disable no-proto */
	var getDesc  = __webpack_require__(19).getDesc
	  , isObject = __webpack_require__(39)
	  , anObject = __webpack_require__(40);
	var check = function(O, proto){
	  anObject(O);
	  if(!isObject(proto) && proto !== null)throw TypeError(proto + ": can't set as prototype!");
	};
	module.exports = {
	  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
	    function(test, buggy, set){
	      try {
	        set = __webpack_require__(15)(Function.call, getDesc(Object.prototype, '__proto__').set, 2);
	        set(test, []);
	        buggy = !(test instanceof Array);
	      } catch(e){ buggy = true; }
	      return function setPrototypeOf(O, proto){
	        check(O, proto);
	        if(buggy)O.__proto__ = proto;
	        else set(O, proto);
	        return O;
	      };
	    }({}, false) : undefined),
	  check: check
	};

/***/ },
/* 48 */
/***/ function(module, exports) {

	// 7.2.9 SameValue(x, y)
	module.exports = Object.is || function is(x, y){
	  return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
	};

/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	// 7.3.20 SpeciesConstructor(O, defaultConstructor)
	var anObject  = __webpack_require__(40)
	  , aFunction = __webpack_require__(16)
	  , SPECIES   = __webpack_require__(27)('species');
	module.exports = function(O, D){
	  var C = anObject(O).constructor, S;
	  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
	};

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	var global    = __webpack_require__(14)
	  , macrotask = __webpack_require__(51).set
	  , Observer  = global.MutationObserver || global.WebKitMutationObserver
	  , process   = global.process
	  , Promise   = global.Promise
	  , isNode    = __webpack_require__(36)(process) == 'process'
	  , head, last, notify;

	var flush = function(){
	  var parent, domain, fn;
	  if(isNode && (parent = process.domain)){
	    process.domain = null;
	    parent.exit();
	  }
	  while(head){
	    domain = head.domain;
	    fn     = head.fn;
	    if(domain)domain.enter();
	    fn(); // <- currently we use it only for Promise - try / catch not required
	    if(domain)domain.exit();
	    head = head.next;
	  } last = undefined;
	  if(parent)parent.enter();
	};

	// Node.js
	if(isNode){
	  notify = function(){
	    process.nextTick(flush);
	  };
	// browsers with MutationObserver
	} else if(Observer){
	  var toggle = 1
	    , node   = document.createTextNode('');
	  new Observer(flush).observe(node, {characterData: true}); // eslint-disable-line no-new
	  notify = function(){
	    node.data = toggle = -toggle;
	  };
	// environments with maybe non-completely correct, but existent Promise
	} else if(Promise && Promise.resolve){
	  notify = function(){
	    Promise.resolve().then(flush);
	  };
	// for other environments - macrotask based on:
	// - setImmediate
	// - MessageChannel
	// - window.postMessag
	// - onreadystatechange
	// - setTimeout
	} else {
	  notify = function(){
	    // strange IE + webpack dev server bug - use .call(global)
	    macrotask.call(global, flush);
	  };
	}

	module.exports = function asap(fn){
	  var task = {fn: fn, next: undefined, domain: isNode && process.domain};
	  if(last)last.next = task;
	  if(!head){
	    head = task;
	    notify();
	  } last = task;
	};

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	var ctx                = __webpack_require__(15)
	  , invoke             = __webpack_require__(52)
	  , html               = __webpack_require__(53)
	  , cel                = __webpack_require__(54)
	  , global             = __webpack_require__(14)
	  , process            = global.process
	  , setTask            = global.setImmediate
	  , clearTask          = global.clearImmediate
	  , MessageChannel     = global.MessageChannel
	  , counter            = 0
	  , queue              = {}
	  , ONREADYSTATECHANGE = 'onreadystatechange'
	  , defer, channel, port;
	var run = function(){
	  var id = +this;
	  if(queue.hasOwnProperty(id)){
	    var fn = queue[id];
	    delete queue[id];
	    fn();
	  }
	};
	var listner = function(event){
	  run.call(event.data);
	};
	// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
	if(!setTask || !clearTask){
	  setTask = function setImmediate(fn){
	    var args = [], i = 1;
	    while(arguments.length > i)args.push(arguments[i++]);
	    queue[++counter] = function(){
	      invoke(typeof fn == 'function' ? fn : Function(fn), args);
	    };
	    defer(counter);
	    return counter;
	  };
	  clearTask = function clearImmediate(id){
	    delete queue[id];
	  };
	  // Node.js 0.8-
	  if(__webpack_require__(36)(process) == 'process'){
	    defer = function(id){
	      process.nextTick(ctx(run, id, 1));
	    };
	  // Browsers with MessageChannel, includes WebWorkers
	  } else if(MessageChannel){
	    channel = new MessageChannel;
	    port    = channel.port2;
	    channel.port1.onmessage = listner;
	    defer = ctx(port.postMessage, port, 1);
	  // Browsers with postMessage, skip WebWorkers
	  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
	  } else if(global.addEventListener && typeof postMessage == 'function' && !global.importScripts){
	    defer = function(id){
	      global.postMessage(id + '', '*');
	    };
	    global.addEventListener('message', listner, false);
	  // IE8-
	  } else if(ONREADYSTATECHANGE in cel('script')){
	    defer = function(id){
	      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){
	        html.removeChild(this);
	        run.call(id);
	      };
	    };
	  // Rest old browsers
	  } else {
	    defer = function(id){
	      setTimeout(ctx(run, id, 1), 0);
	    };
	  }
	}
	module.exports = {
	  set:   setTask,
	  clear: clearTask
	};

/***/ },
/* 52 */
/***/ function(module, exports) {

	// fast apply, http://jsperf.lnkit.com/fast-apply/5
	module.exports = function(fn, args, that){
	  var un = that === undefined;
	  switch(args.length){
	    case 0: return un ? fn()
	                      : fn.call(that);
	    case 1: return un ? fn(args[0])
	                      : fn.call(that, args[0]);
	    case 2: return un ? fn(args[0], args[1])
	                      : fn.call(that, args[0], args[1]);
	    case 3: return un ? fn(args[0], args[1], args[2])
	                      : fn.call(that, args[0], args[1], args[2]);
	    case 4: return un ? fn(args[0], args[1], args[2], args[3])
	                      : fn.call(that, args[0], args[1], args[2], args[3]);
	  } return              fn.apply(that, args);
	};

/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(14).document && document.documentElement;

/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(39)
	  , document = __webpack_require__(14).document
	  // in old IE typeof document.createElement is 'object'
	  , is = isObject(document) && isObject(document.createElement);
	module.exports = function(it){
	  return is ? document.createElement(it) : {};
	};

/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	var redefine = __webpack_require__(17);
	module.exports = function(target, src){
	  for(var key in src)redefine(target, key, src[key]);
	  return target;
	};

/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var core        = __webpack_require__(3)
	  , $           = __webpack_require__(19)
	  , DESCRIPTORS = __webpack_require__(21)
	  , SPECIES     = __webpack_require__(27)('species');

	module.exports = function(KEY){
	  var C = core[KEY];
	  if(DESCRIPTORS && C && !C[SPECIES])$.setDesc(C, SPECIES, {
	    configurable: true,
	    get: function(){ return this; }
	  });
	};

/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	var ITERATOR     = __webpack_require__(27)('iterator')
	  , SAFE_CLOSING = false;

	try {
	  var riter = [7][ITERATOR]();
	  riter['return'] = function(){ SAFE_CLOSING = true; };
	  Array.from(riter, function(){ throw 2; });
	} catch(e){ /* empty */ }

	module.exports = function(exec, skipClosing){
	  if(!skipClosing && !SAFE_CLOSING)return false;
	  var safe = false;
	  try {
	    var arr  = [7]
	      , iter = arr[ITERATOR]();
	    iter.next = function(){ safe = true; };
	    arr[ITERATOR] = function(){ return iter; };
	    exec(arr);
	  } catch(e){ /* empty */ }
	  return safe;
	};

/***/ }
/******/ ]);