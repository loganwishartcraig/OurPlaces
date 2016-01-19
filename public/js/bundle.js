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

	'use strict';

	var Auth = __webpack_require__(1);

	$(document).ready(function () {

	  // Auth.getToken('loganwishartcraig@gmail.com', 'm0mandD4D~');

	});

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';

	module.exports = {

	  getToken: function getToken(user, pass) {

	    console.log(user, pass);

	    var base = 'https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=919257842102-bpf16gm6ga69os8vl809l82biiqc5j40.apps.googleusercontent.com&nonce=DgkRrHXmyu3KLd0KDdfq';
	    $.get(base, function (res) {
	      console.log(res);
	    });
	  }

	};

	// cid: 919257842102-bpf16gm6ga69os8vl809l82biiqc5j40.apps.googleusercontent.com
	// secret: JYOtDKIMTt9ebWAYowix-NlM

/***/ }
/******/ ]);