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
/***/ function(module, exports) {

	"use strict";

	$(document).ready(function () {

	  // register variables for global access
	  var map;
	  var searchServices;
	  var infoWindow;
	  var searchTextBox;
	  var prefetchResults;

	  function initialize() {

	    map = new MapArea("map");

	    // Create the interface w/ google.
	    searchServices = new SearchServices(map.map);

	    searchTextBox = new TextBox("#placeSearchInput");

	    prefetchResults = new PrefetchResults("#predictiveContainer");

	    // register global event handlers
	    registerHandlers();
	  }

	  function SearchServices(map) {

	    console.log(map);
	    this.placeServiceConn = new google.maps.places.PlacesService(map);

	    this.buildSearchRequest = function (keyword) {

	      return {
	        location: new google.maps.LatLng(-33.8665, 151.1956),
	        radius: '500',
	        keyword: keyword
	      };
	    };

	    this.nearbySearch = function (keyword, cb) {
	      var req = this.buildSearchRequest(keyword);
	      this.placeServiceConn.nearbySearch(req, cb);
	    }.bind(this);

	    this.placeDetails = function (placeId, cb) {
	      var req = { placeId: placeId };
	      console.log(req);
	      this.placeServiceConn.getDetails(req, cb);
	    }.bind(this);
	  }

	  function MapArea(ID) {

	    this.mapContainer = document.getElementById(ID);
	    this.mapContainer.addEventListener('click', function (e) {

	      if (e.srcElement.attributes.place_id) console.log('saving! ' + e.srcElement.attributes.place_id.value);
	    });

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

	    this.generateInfoWindow = function (place) {
	      var contentString = '<div><button class="save--place" place_id="' + place.place_id + '">Save Place</button><span>' + place.name + '</span></div>';

	      var infoWindow = new google.maps.InfoWindow({
	        content: contentString,
	        place_id: place.place_id
	      });

	      return infoWindow;
	    };

	    this.generateMarker = function (place) {
	      return new google.maps.Marker({
	        map: this.map,
	        position: place.geometry.location,
	        title: place.name
	      });
	    };

	    this.placeMarker = function (place) {
	      var marker = this.generateMarker(place);
	      var infoWindow = this.generateInfoWindow(place);
	      infoWindow.opened = false;
	      console.log(place);
	      marker.addListener('click', function () {
	        console.log("clicked ", marker, infoWindow.opened);
	        if (infoWindow.opened) {
	          console.log('closing');

	          infoWindow.close(this.map, marker);
	        } else {
	          infoWindow.open(this.map, marker);
	        }
	        infoWindow.opened = !infoWindow.opened;
	      });
	    }.bind(this);

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
	  }

	  // binds a function tree for text boxes (class?) to an element
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

	  function handleSearchInput(evt) {

	    if (evt.keyCode === 13) return map.execNearbySearch(searchTextBox.getInput());

	    if (searchTextBox.length() === 0) return prefetchResults.clear();
	    if (searchTextBox.length() >= 4) return prefetchResults.fetch(searchTextBox.getInput());
	  }

	  // registers global event handlers
	  function registerHandlers() {
	    // search submit button => excecute search
	    document.getElementById('placesSearchSubmit').addEventListener('click', function () {
	      map.execNearbySearch(searchTextBox.getInput());
	    });
	    document.getElementById('placeSearchInput').addEventListener('keyup', handleSearchInput);
	  }

	  // Run the initialize function when the window has finished loading.
	  // google.maps.event.addDomListener(window, 'load', initialize);
	  initialize();
	});

/***/ }
/******/ ]);