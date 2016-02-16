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
	    var searchTextBox;

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

	        searchTextBox = new TextBox("#placeSearchInput");

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
	        console.log(marker);
	    }

	    // handles response for nearby search
	    function plotPlaces(res, status) {
	        console.log(res, status);
	        // proceed only if succeeded
	        if (status == google.maps.places.PlacesServiceStatus.OK) {
	            // make a marker for each result
	            for (var i = 0; i < res.length; i++) {
	                placeMarker(res[i]);
	            }
	        }
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

	    // function to execute the search
	    function execNearbySearch() {
	        var request = buildSearchRequest();
	        placeService.nearbySearch(request, plotPlaces);
	    }

	    function setResultsList(selector, resultList) {
	        var resultContainer = $(selector);
	        resultContainer.children().not('li:first').remove();
	        resultContainer.children('li:first').addClass('hide');

	        resultList.forEach(function (item, index) {
	            var toAdd = $("<li></li>");
	            toAdd.text(item);
	            console.log("adding", toAdd);
	            resultContainer.append(toAdd);
	        });
	    }

	    function populateResultNames(res, status) {
	        console.log(res, status);
	        // proceed only if succeeded
	        var resultList = [];
	        if (status === google.maps.places.PlacesServiceStatus.OK) {
	            // make a marker for each result
	            for (var i = 0; i < res.length; i++) {
	                resultList.push(res[i].name);
	            }
	            console.log(resultList);
	            setResultsList("#predictiveContainer", resultList);
	        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
	            setResultsList("#predictiveContainer", []);
	        }
	    }

	    function pullSuggestions() {
	        console.log("pulling");
	        var request = buildSearchRequest();
	        placeService.nearbySearch(request, populateResultNames);
	    }

	    function handleSearchInput(evt) {

	        var loadingImg = $(".prefetch--load--img");

	        if (evt.keyCode === 13) return execNearbySearch();

	        if (searchTextBox.length() > 3) {
	            if (searchTextBox.isEmpty() && !loadingImg.hasClass('hide')) loadingImg.toggleClass('hide');
	            if (!searchTextBox.isEmpty() && loadingImg.hasClass('hide')) loadingImg.toggleClass('hide');
	            pullSuggestions();
	        }
	    }

	    // registers global event handlers
	    function registerHandlers() {
	        // search submit button => excecute search
	        document.getElementById('placesSearchSubmit').addEventListener('click', execNearbySearch);
	        document.getElementById('placeSearchInput').addEventListener('keyup', handleSearchInput);
	    }

	    // Run the initialize function when the window has finished loading.
	    // google.maps.event.addDomListener(window, 'load', initialize);
	    initialize();
	});

/***/ }
/******/ ]);