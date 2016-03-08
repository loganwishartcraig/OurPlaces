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

	var _keys = __webpack_require__(4);

	var _keys2 = _interopRequireDefault(_keys);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	$(document).ready(function () {

	  // register variables for global access
	  var map;
	  var searchServices;
	  var searchTextBox;
	  var userInterface;
	  var prefetchResults;

	  function initialize() {

	    // Load google map on element w/ id 'map'
	    map = new MapArea("map");

	    // Centralize interface w/ google services.
	    searchServices = new SearchServices(map.map);

	    // binds a textbox class to search box
	    searchTextBox = new TextBox("#placeSearchInput");

	    // sets up predictive search
	    prefetchResults = new PrefetchResults("#predictiveContainer");

	    // sets up interface for user account
	    userInterface = new UserInterface();

	    // register global event handlers
	    registerHandlers();
	  }

	  function UserInterface() {

	    this.init = function () {
	      $.get('/user/getUser').success(function (data) {
	        console.log('got user', data);
	        this.user = data;
	      }.bind(this)).error(function (err) {
	        console.log(err);
	      }.bind(this));
	    };

	    this.hasPlace = function (place_id) {
	      console.log(place_id, this.user.ownedPlaces.hasOwnProperty(place_id));
	      return this.user.ownedPlaces.hasOwnProperty(place_id);
	    };

	    this.removePlace = function (placeId) {
	      delete this.user.ownedPlaces[placeId];
	    };

	    this.addPlace = function (place) {
	      this.user.ownedPlaces[place.place_id] = place;
	    };

	    this.addFriend = function (friendId) {

	      $.post('/user/addRequest', {
	        friendId: friendId
	      }).success(function (msg) {
	        console.log(msg);
	      }).error(function (err) {
	        console.log(err);
	      });
	    };

	    this.removeFriend = function (friend) {};

	    // *************NEEDS ATTENTION***************
	    // - should be refactored into a 'get x' generator
	    this.getMyPlaces = function () {

	      var toReturn = [];

	      (0, _keys2.default)(this.user.ownedPlaces).forEach(function (item, index) {
	        toReturn.push(this.user.ownedPlaces[item]);
	      }.bind(this));

	      return toReturn;
	    };

	    // *************NEEDS ATTENTION***************
	    // - should be refactored into a 'get x' generator
	    this.getFriendPlaces = function () {
	      var toReturn = [];

	      (0, _keys2.default)(this.user.friendsPlaces).forEach(function (item, index) {
	        toReturn.push(this.user.friendsPlaces[item]);
	      }.bind(this));

	      return toReturn;
	    };

	    this.init();
	  }

	  // Holds functions related to using google search services
	  // Used to provide a central location for using search services
	  function SearchServices(map) {

	    // initalize connection with google places + set relevant map
	    this.placeServiceConn = new google.maps.places.PlacesService(map);

	    // *************NEEDS ATTENTION***************
	    // - should be more flexible, location should not be static.
	    // function for building basic search requests
	    this.buildSearchRequest = function (keyword) {
	      return {
	        location: new google.maps.LatLng(-33.8665, 151.1956),
	        radius: '500',
	        keyword: keyword
	      };
	    };

	    // executes a nearby search + calls the callback provided
	    this.nearbySearch = function (keyword, cb) {
	      var req = this.buildSearchRequest(keyword);
	      this.placeServiceConn.nearbySearch(req, cb);
	    }.bind(this);

	    // executes a place detail search + calls callback
	    this.placeDetails = function (placeId, cb) {
	      var req = {
	        placeId: placeId
	      };
	      this.placeServiceConn.getDetails(req, cb);
	    }.bind(this);
	  }

	  // class that manages info windows
	  function infoWindow(map, place, marker) {

	    // set references to relevant map items
	    this.map = map;
	    this.place = place;
	    this.marker = marker;

	    this.classes = {
	      save: 'save--place',
	      remove: 'remove--place'
	    };

	    // set class name + template for HTML
	    this.mainTemplate = '<div>{{ACTION_BTN}}<span>{{PLACE_NAME}}</span></div>';
	    this.btnTemplate = '<button class="{{BTN_CLASS}}" place_id="{{PLACE_ID}}">{{BTN_TEXT}}</button>';

	    // set initial 'open' state
	    this.open = false;

	    // *************NEEDS ATTENTION***************
	    // - probably a better way to build the template?
	    this.buildActionBtn = function (place) {
	      console.log('checking if saved...', userInterface.hasPlace(place.place_id));
	      if (userInterface.hasPlace(place.place_id)) {
	        return this.btnTemplate.replace("{{BTN_CLASS}}", this.classes.remove).replace("{{PLACE_ID}}", place.place_id).replace("{{BTN_TEXT}}", 'Remove Place');
	      } else {
	        return this.btnTemplate.replace("{{BTN_CLASS}}", this.classes.save).replace("{{PLACE_ID}}", place.place_id).replace("{{BTN_TEXT}}", 'Save Place');
	      }
	    };

	    // function for formatting the template into useable HTML string
	    this.buildInfoWindow = function (place) {

	      var btn = this.buildActionBtn(place);

	      var contentString = this.mainTemplate.replace("{{PLACE_ID}}", place.place_id).replace("{{PLACE_NAME}}", place.name).replace("{{ACTION_BTN}}", btn);

	      return contentString;
	    };

	    this.rebuildInfoContent = function (place) {
	      this.pane.setContent(this.buildInfoWindow(place));
	    };

	    // *************NEEDS ATTENTION***************
	    // - could potentially use generators again here?
	    // - maybe abstract out the success/error funcitons
	    // function used when 'save place' button is clicked.
	    // Posts place information to server & handles response
	    this.savePlace = function (place) {
	      console.log('saving! ' + place);
	      var data = (0, _stringify2.default)(place);
	      $.post('/user/addPlace', {
	        place: data
	      }).success(function (msg) {
	        // on success, log message
	        console.log(msg);
	        userInterface.addPlace(place);
	        this.rebuildInfoContent(place);
	      }.bind(this)).error(function (err) {
	        // on error, log error
	        console.log(err);
	      });
	    };

	    // *************NEEDS ATTENTION***************
	    // - could potentially use generators again here?
	    // - maybe abstract out the success/error funcitons
	    this.removePlace = function (place) {
	      console.log('removing! ' + (0, _stringify2.default)(place));
	      var data = (0, _stringify2.default)(place);
	      $.post('/user/removePlace', {
	        place: data
	      }).success(function (msg) {
	        // on success, log message
	        console.log(msg);
	        userInterface.removePlace(place.place_id);
	        this.rebuildInfoContent(place);
	      }.bind(this)).error(function (err) {
	        // on error, log error
	        console.log(err);
	      });
	    };

	    // *************NEEDS ATTENTION***************
	    // - again, maybe use generators, seems like lots of duplicated code
	    // - should abstract out setting the event/handler?
	    // Attaches a click event to the 'save place' button
	    // Only executed after info window becomes accessable through DOM.
	    // Passes place info to 'savePlace' function
	    this.registerSaveHandler = function (place) {

	      var query;

	      if (userInterface.hasPlace(place.place_id)) {
	        // finds element through class name + place_id attr selector
	        query = '.' + this.classes.remove + "[place_id='" + place.place_id + "']";

	        $(query).on('click', function () {
	          this.removePlace(place);
	        }.bind(this));
	      } else {

	        query = '.' + this.classes.save + "[place_id='" + place.place_id + "']";

	        $(query).on('click', function () {
	          this.savePlace(place);
	        }.bind(this));
	      }
	    };

	    // Builds the actual info window and sets 'domready'
	    // function that registers a save handler for place when
	    // content is DOM accessable
	    this.setInfoWindow = function (place) {

	      this.pane = new google.maps.InfoWindow({
	        content: this.buildInfoWindow(place)
	      });

	      // only try to register save handler when content is ready
	      google.maps.event.addListener(this.pane, 'domready', function () {
	        this.registerSaveHandler(place);
	      }.bind(this));
	    };

	    // function for toggling the window's visability.
	    // sets map and location for window.
	    this.toggleOpen = function () {
	      // could be formatted nicer.
	      if (this.open) {
	        this.pane.close(this.map, this.marker);
	      } else {
	        this.pane.open(this.map, this.marker);
	      }
	      this.open = !this.open;
	    };

	    // set the info window when opened
	    this.setInfoWindow(this.place);
	  }

	  function MapArea(ID) {

	    this.mapContainer = document.getElementById(ID);

	    // set starting point for map
	    this.pyrmont = new google.maps.LatLng(-33.8665, 151.1956);

	    // create new map on global variable
	    this.map = new google.maps.Map(this.mapContainer, {
	      center: this.pyrmont,
	      zoom: 15,
	      scrollwheel: true,
	      disableDefaultUI: false,
	      mapTypeControl: true

	    });

	    this.generateMarker = function (place) {
	      return new google.maps.Marker({
	        map: this.map,
	        position: place.geometry.location,
	        title: place.name
	      });
	    };

	    this.placeMarker = function (place) {
	      var marker = this.generateMarker(place);
	      var infoPane = new infoWindow(this.map, place, marker);
	      marker.addListener('click', function () {
	        infoPane.toggleOpen();
	      });
	    }.bind(this);

	    // *************NEEDS ATTENTION***************
	    // - shouldn't be requiring a google status.
	    this.plotPlaces = function (res, status) {
	      console.log(res, status);
	      // proceed only if succeeded
	      if (status == google.maps.places.PlacesServiceStatus.OK) {
	        // make a marker for each result
	        for (var i = 0; i < res.length; i++) {
	          this.placeMarker(res[i]);
	        }
	      }
	    }.bind(this);

	    this.execNearbySearch = function (searchTerm) {
	      console.log("executing search");
	      searchServices.nearbySearch(searchTerm, this.plotPlaces);
	    };

	    this.execSearchById = function (placeId) {
	      searchServices.placeDetails(placeId, this.placeMarker);
	    };

	    // *************NEEDS ATTENTION***************
	    // - GENERATORS.
	    // - need to create some sort of internally managed array to keep track
	    //   of markers so they can be toggled.
	    this.plotMyPlaces = function () {
	      var myPlaces = userInterface.getMyPlaces();

	      for (var i = 0; i < (0, _keys2.default)(myPlaces).length; i++) {
	        this.placeMarker(myPlaces[i]);
	      }
	    };

	    // *************NEEDS ATTENTION***************
	    // - GENERATORS.
	    this.plotFriendPlaces = function () {
	      var myPlaces = userInterface.getFriendPlaces();

	      for (var i = 0; i < (0, _keys2.default)(myPlaces).length; i++) {
	        this.placeMarker(myPlaces[i]);
	      }
	    };
	  }

	  function TextBox(selector) {
	    var _this = this;

	    this.textArea = $(selector);

	    this.getInput = function () {
	      return _this.textArea.val();
	    };
	    this.isEmpty = function () {
	      return _this.textArea.val() === '';
	    };
	    this.length = function () {
	      return _this.textArea.val().length;
	    };
	  }

	  function PrefetchResults(selector) {
	    this.resultContainer = $(selector);
	    this.loading = false;

	    this.createListItem = function (item) {
	      item = item || {
	        name: '',
	        place_id: ''
	      };
	      var toAdd = $("<li place_id='" + item.place_id + "'></li>");
	      toAdd.text(item.name);
	      $(toAdd).on('click', function () {
	        map.execSearchById(item.place_id);
	      });
	      return toAdd;
	    };

	    this.set = function (resultList) {
	      console.log("setting");

	      // %
	      if (resultList.length !== 0) {
	        resultList.forEach(function (item, index) {
	          console.log(item);
	          var toAdd = this.createListItem(item);
	          this.resultContainer.append(toAdd);
	        }.bind(this));
	      } else {
	        var toAdd = this.createListItem();
	        toAdd.text("No Results :/");
	        console.log("adding", toAdd);
	        this.resultContainer.append(toAdd);
	      }
	      // %
	    };

	    this.clear = function () {
	      console.log("clearing");
	      this.resultContainer.children().not('li:first').remove();
	    };

	    this.toggleLoading = function () {
	      console.log("toggling load");
	      this.resultContainer.children('li:first').toggleClass('hide');
	      this.loading = !this.loading;
	    };

	    this.fetch = function (searchTerm) {
	      console.log("pulling");
	      this.toggleLoading();
	      searchServices.nearbySearch(searchTerm, function (data, status) {
	        console.log("recieved data", status);
	        this.clear();
	        this.toggleLoading();
	        if (status === google.maps.places.PlacesServiceStatus.OK) return this.set(data);
	        if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) return this.set([]);
	      }.bind(this));
	    };
	  }

	  function handleSearchSubmit(evt) {
	    map.execNearbySearch(searchTextBox.getInput());
	  }

	  function handleSearchInput(evt) {

	    if (evt.keyCode === 13) return map.execNearbySearch(searchTextBox.getInput());

	    if (searchTextBox.length() === 0) return prefetchResults.clear();
	    if (searchTextBox.length() >= 4) return prefetchResults.fetch(searchTextBox.getInput());
	  }

	  function handleRequestSubmit(evt) {

	    var friendId = $('.request--input').val();

	    if (!friendId) return console.error('No Friend ID was entered');

	    userInterface.addFriend(friendId);
	  }

	  function handleMyPlaceFilter(evt) {
	    map.plotMyPlaces();
	  }

	  function handleFriendPlaceFilter(evt) {
	    map.plotFriendPlaces();
	  }

	  function handleOpenMail(evt) {
	    $('.mail--items').toggleClass('hide');
	  }

	  // *************NEEDS ATTENTION***************
	  // - generator or use bubbling
	  function handleReqAccept(evt) {
	    var target = $(evt.target);
	    var id = $(target.parent()).attr('request-id');
	    console.log("accepting ", id);
	    $.post('/user/acceptRequest', { friendId: id }).success(function (msg) {
	      console.log(msg);
	    }).error(function (err) {
	      console.log(err);
	    });
	  }

	  function handleReqReject(evt) {}

	  // registers global event handlers
	  function registerHandlers() {
	    // search submit button => excecute search
	    document.getElementById('placesSearchSubmit').addEventListener('click', handleSearchSubmit);
	    document.getElementById('placeSearchInput').addEventListener('keyup', handleSearchInput);
	    document.getElementById('addFriendSubmit').addEventListener('click', handleRequestSubmit);
	    document.getElementById('filterMyPlaces').addEventListener('click', handleMyPlaceFilter);
	    document.getElementById('filterFriendPlaces').addEventListener('click', handleFriendPlaceFilter);
	    document.getElementById('openMail').addEventListener('click', handleOpenMail);

	    // *************NEEDS ATTENTION***************
	    $(".mail--btn.accept").click(handleReqAccept);
	    $(".mail--btn.reject").click(handleReqReject);
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
	module.exports = __webpack_require__(3).Object.keys;

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.14 Object.keys(O)
	var toObject = __webpack_require__(7);

	__webpack_require__(9)('keys', function($keys){
	  return function keys(it){
	    return $keys(toObject(it));
	  };
	});

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.13 ToObject(argument)
	var defined = __webpack_require__(8);
	module.exports = function(it){
	  return Object(defined(it));
	};

/***/ },
/* 8 */
/***/ function(module, exports) {

	// 7.2.1 RequireObjectCoercible(argument)
	module.exports = function(it){
	  if(it == undefined)throw TypeError("Can't call method on  " + it);
	  return it;
	};

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	// most Object methods by ES6 should accept primitives
	var $export = __webpack_require__(10)
	  , core    = __webpack_require__(3)
	  , fails   = __webpack_require__(14);
	module.exports = function(KEY, exec){
	  var fn  = (core.Object || {})[KEY] || Object[KEY]
	    , exp = {};
	  exp[KEY] = exec(fn);
	  $export($export.S + $export.F * fails(function(){ fn(1); }), 'Object', exp);
	};

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var global    = __webpack_require__(11)
	  , core      = __webpack_require__(3)
	  , ctx       = __webpack_require__(12)
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
/* 11 */
/***/ function(module, exports) {

	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var global = module.exports = typeof window != 'undefined' && window.Math == Math
	  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
	if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	// optional / simple context binding
	var aFunction = __webpack_require__(13);
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
/* 13 */
/***/ function(module, exports) {

	module.exports = function(it){
	  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
	  return it;
	};

/***/ },
/* 14 */
/***/ function(module, exports) {

	module.exports = function(exec){
	  try {
	    return !!exec();
	  } catch(e){
	    return true;
	  }
	};

/***/ }
/******/ ]);