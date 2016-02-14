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

	'use strict';

	$(document).ready(function () {

	  // register variables for global access
	  var map;
	  var placeService;
	  var infoWindow;

	  function initialize() {

	    // set starting point for map
	    var pyrmont = new google.maps.LatLng(-33.8665, 151.1956);

	    // create new map on global variable
	    map = new google.maps.Map(document.getElementById('map'), {
	      center: pyrmont,
	      zoom: 15,
	      scrollwheel: true,
	      disableDefaultUI: true
	    });

	    // Create the PlaceService and send the request.
	    placeService = new google.maps.places.PlacesService(map);

	    // register global event handlers
	    registerHandlers();
	  }

	  // function for builidng nearby search requests;
	  function buildSearchRequest() {

	    return {
	      location: new google.maps.LatLng(-33.8665, 151.1956),
	      radius: '500',
	      keyword: $('#placeSearchInput').val()
	    };
	  }

	  function placeMarker(place) {
	    var marker = new google.maps.Marker({
	      map: map,
	      position: place.geometry.location
	    });
	  }

	  // handles response for nearby search
	  function searchCallback(res, status) {
	    console.log(res, status);
	    // proceed only if succeeded
	    if (status == google.maps.places.PlacesServiceStatus.OK) {
	      // make a marker for each result
	      for (var i = 0; i < res.length; i++) {
	        placeMarker(res[i]);
	      }
	    }
	  }

	  // function to execute the search
	  function execNearbySearch() {
	    var request = buildSearchRequest();
	    placeService.nearbySearch(request, searchCallback);
	  }

	  // registers global event handlers
	  function registerHandlers() {
	    // search submit button => excecute search
	    document.getElementById('placesSearchSubmit').addEventListener('click', execNearbySearch);
	  }

	  // Run the initialize function when the window has finished loading.
	  // google.maps.event.addDomListener(window, 'load', initialize);
	  initialize();
	});

/***/ }
/******/ ]);