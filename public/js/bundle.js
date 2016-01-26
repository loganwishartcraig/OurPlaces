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

	  function removeRequest(elm, request) {
	    document.getElementById(elm).removeChild(request);
	  }

	  // abstract post into promise

	  function handleRequestAction(e) {
	    if (e.target.tagName === 'BUTTON') {
	      switch (e.target.getAttribute('action')) {
	        case 'ACCEPT':
	          $.post('/user/acceptRequest', {
	            friendId: e.target.getAttribute('value')
	          }).success(function (msg) {
	            console.log(msg);
	            removeRequest('friendRequests', e.target.parentElement);
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

	  function handleFriendAction(e) {

	    if (e.target.tagName === 'BUTTON') {
	      switch (e.target.getAttribute('action')) {
	        case 'DELETE':
	          $.post('/user/removeFriend', {
	            friendId: e.target.getAttribute('value')
	          }).success(function (msg) {
	            console.log(msg);
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

	  function handleAddFriendAction(e) {
	    e.preventDefault();

	    var friendName = document.getElementById('friendToAdd').value;

	    if (e.target.tagName === 'BUTTON') {
	      switch (e.target.getAttribute('action')) {
	        case 'SEND':
	          $.post('/user/addRequest', {
	            friendId: friendName
	          }).success(function (msg) {
	            console.log(msg);
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

	  document.getElementById('friendRequests').addEventListener('click', handleRequestAction);
	  document.getElementById('friendList').addEventListener('click', handleFriendAction);
	  document.getElementById('addFriend').addEventListener('click', handleAddFriendAction);
	});

/***/ }
/******/ ]);