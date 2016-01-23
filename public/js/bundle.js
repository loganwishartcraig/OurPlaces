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

	  function formatRequests(fqList) {

	    var requests = [];

	    for (var key in fqList) {
	      if (fqList.hasOwnProperty(key)) {

	        // replace w/ template html...

	        var container = document.createElement('li');

	        var fName = document.createElement('span');
	        var accept = document.createElement('button');
	        var decline = document.createElement('button');

	        fName.setAttribute('class', 'request--firstName');
	        fName.textContent = fqList[key].firstName;

	        accept.setAttribute('type', 'button');
	        accept.setAttribute('class', 'request--accept');
	        accept.setAttribute('value', key);
	        accept.setAttribute('action', 'ACCEPT');
	        accept.textContent = 'Accept';

	        decline.setAttribute('type', 'button');
	        decline.setAttribute('class', 'request--decline');
	        decline.setAttribute('value', key);
	        decline.setAttribute('action', 'DECLINE');
	        decline.textContent = 'Decline';

	        container.setAttribute('class', 'request--item');
	        container.appendChild(fName);
	        container.appendChild(accept);
	        container.appendChild(decline);

	        requests.push(container);
	      }
	    }
	    return requests;
	  }

	  function pullFriendRequests() {

	    $.get('/user/getFriendRequests').success(function (msg) {

	      var formattedRequests = formatRequests(msg);
	      console.log(formattedRequests);
	      setFriendRequests('friendRequests', formattedRequests);
	    }).error(function (msg) {
	      console.log(msg);
	    });
	  }

	  function setFriendRequests(elm, data) {

	    var container = document.getElementById(elm);
	    data.forEach(function (item, index) {
	      container.appendChild(item);
	    });
	  }

	  function removeRequest(elm, request) {
	    document.getElementById(elm).removeChild(request);
	  }

	  function handleRequestAction(e) {
	    if (e.target.tagName === 'BUTTON') {
	      switch (e.target.getAttribute('action')) {
	        case 'ACCEPT':
	          $.post('/user/addFriend', {
	            friendId: e.target.getAttribute('value')
	          }).success(function (msg) {
	            console.log(msg);
	            removeRequest('friendRequests', e.target);
	          }).error(function (err) {
	            console.log(err);
	          });
	          break;
	        case 'DECLINE':
	          $.post('/user/removeRequest', {
	            friendId: e.target.getAttribute('value')
	          }).success(function (msg) {
	            console.log(msg);
	            removeRequest('friendRequests', e.target.parentElement);
	          }).error(function (err) {
	            console.log(err);
	          });
	          break;
	        default:
	          console.log('action not found...');
	          break;
	      }
	    }
	  }

	  pullFriendRequests();

	  document.getElementById('friendRequests').addEventListener('click', handleRequestAction);
	});

/***/ }
/******/ ]);