$(document).ready(function() {

  // register variables for global access
  var map;
  var searchServices;
  var searchTextBox;
  var userInterface;
  var prefetchResults;
  var notifications;
  var friendController;
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

    // binds conroller to update friends
    friendController = new FriendController("#friendList");

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
          console.log('accepted!', msg);
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

    this.getOwnedPlaces = function() {
      return this.user.ownedPlaces;
    };

    this.getFriendPlaces = function() {
      return this.user.friendsPlaces;
    };

    this.logout = function() {

      return (new Promise(function(res, rej) {

        $.post('/user/logout').success(function(msg) {
          res(msg);
        }).error(function(err) {
          rej(err);
        });

      }));

    }
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
        main: 'place--save--btn',
        save: 'save',
        remove: 'remove'
      }
    };

    this.templates = {
      actionBtn: {
        save: '<button class="place--save--btn %%BTN_CLASS_ACTION%%" place_id="%%PLACE_ID%%">Save</button>',
        remove: '<button class="place--save--btn %%BTN_CLASS_ACTION%%" place_id="%%PLACE_ID%%">Remove</button>'
      },
      savedBy: '<span class="place--marker--saved">Saved By: %%SAVE_LIST%%</span>',
      mainContainer: '<div><span class="place--marker--title">%%PLACE_NAME%%</span><hr/>%%SAVED_BY%%<hr/>%%ACTION_BTN%%</div>',
      btnDOMQuery: '.%%BTN_CLASS%%[place_id="%%PLACE_ID%%"]'
    };

    this.buildActionButton = function(place) {
      // WHERE SHOULD THIS CHECK BE? Should a 'savedPlace' flag be set on 'place'? Should 'marker' be passed with a flag? 
      if (userInterface.hasPlace(place.place_id)) {
        return this.templates.actionBtn.remove.replace('%%BTN_CLASS_ACTION%%', this.classes.actionBtn.remove);
      } else {
        return this.templates.actionBtn.save.replace('%%BTN_CLASS_ACTION%%', this.classes.actionBtn.save);
      }
    };

    this.buildSavedBy = function(place) {

      return (place.savedBy) ? this.templates.savedBy.replace('%%SAVE_LIST%%', place.savedBy.join(', ')) : '';

    };

    this.buildInfoWindow = function(place) {

      var button = this.buildActionButton(place);
      var savedBy = this.buildSavedBy(place);

      var contentString = this.templates.mainContainer
        .replace("%%ACTION_BTN%%", button)
        .replace('%%SAVED_BY%%', savedBy)
        .replace("%%PLACE_NAME%%", place.name)
        .replace("%%PLACE_ID%%", place.place_id);

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
        var query = this.templates.btnDOMQuery
          .replace('%%BTN_CLASS%%', this.classes.actionBtn.main)
          .replace('%%PLACE_ID%%', place.place_id);

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

      // should this be here?
      marker.setBy = setBy;
      marker.place_id = place.place_id;
      marker.savedBy = place.savedBy;


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

      this.plotPlaces(res, 'SEARCH_SVC');

    };

    this.plotPlaces = function(places, setBy) {

      if (Object.prototype.toString.call(places) === '[object Object]') return this.placeMarker(places, this.map, setBy);

      places.forEach(function(place) {
        this.placeMarker(place, this.map, setBy);
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
      mainContainer: '<li place_id="%%PLACE_ID%%">%%PLACE_NAME%%</li>',
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
        .replace('%%PLACE_ID%%', place.place_id)
        .replace('%%PLACE_NAME%%', place.name));
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

  function FriendController(node) {

    this.friendContainer = $(node);
    this.itemTemplate = $("#friendTemplate").html();

    this.addItem = function(friend) {

      var rawHTML = this.itemTemplate.replace("%%USERNAME%%", friend.username)
        .replace("%%FNAME%%", friend.firstName)
        .replace("%%LNAME%%", friend.lastName)
        .replace("%%PLACE_COUNT%%", friend.placeCount)
        .replace("%%FRIEND_ID%%", friend.userId);

      var toAdd = $(rawHTML);

      toAdd.children('button.friend--remove[friend_id="' + friend.userId + '"]').click(handleRemoveFriend);

      if (this.friendContainer.children().length === 1) {
        this.friendContainer.children().last().addClass('hide');
      }

      this.friendContainer.prepend(toAdd);

      // if (userInterface.hasFriends()) {
      //   this.friendContainer.last().addClass('hide');
      // }

      

    };

    this.removeItem = function(friendId) {

      var btn = $('.friend--remove[friend_id="' + friendId + '"]');
      btn.parentsUntil('ul')[0].remove();


      if (this.friendContainer.children().length === 1) {
        this.friendContainer.children().last().removeClass('hide');
      }

    };

  }


  function notificationController(node) {

    this.requestContainer = $(node);

    this.noRequests = $('.friend--request.empty');
    this.iconContainer = $('.mail--img');

    this.reqCount = this.requestContainer.children().length - 2;

    this.removeItem = function(requestId) {
      console.log(requestId);
      var query = "li[request_id='%%REQ_ID%%']".replace('%%REQ_ID%%', requestId);
      console.log(query);

      this.requestContainer.children(query)[0].remove();
      this.reqCount--;
      if (this.reqCount === 0) this.toggleRequestActive();
    };


    // this.accept = function(friendId) {
    //   console.log('accepting ', friendId);

    //   // userInterface.acceptRequest(friendId).then(function(msg) {

    //   //   console.log('success! ', msg);
    //   //   this.removeItem(friendId);

    //   // }.bind(this), setMessage.setConsole);

    // };


    // this.reject = function(friendId) {
    //   // console.log('rejecting ', friendId);

    //   // userInterface.rejectRequest(friendId).then(function(msg) {

    //   //   console.log('success! ', msg);
    //   //   this.removeItem(friendId);

    //   // }.bind(this), setMessage.setConsole);

    // };

    this.toggleRequestActive = function() {

      this.iconContainer.removeClass('active');
      this.iconContainer.addClass('inactive');

      this.noRequests.removeClass('hide');

      this.toggleRequestVisibilty();

    };

    this.toggleRequestVisibilty = function() {
      // blur effect / class toggle is very similar to friends bttn
      this.requestContainer.toggleClass('hide');
      
      // blur bg effect?
      // this.requestContainer.siblings().each(
      // function(i, node) {
      //   $(node).toggleClass('blur');
      // }
    // );

    };



  }


  function handleSearchSubmit(evt) {

    var searchTerm = searchTextBox.val();
    console.log('starting nearby search...');
    searchServices.nearbySearch(searchTerm).then(function(data) {
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

    if (searchTerm.length === 0) {
      prefetchResults.clear();
      map.clearSearchPlaces();
    };
    if (searchTerm.length >= 2) return prefetchResults.fetch(searchTerm);

  }


  function handleMyPlaceFilter(evt) {

    var filterBtn = $(evt.target);
    if (filterBtn.hasClass('active')) {
      map.clearMarkers(function(marker) {
        return (marker.setBy === 'USER_FLTR') ? true : false;
      });
    } else {
      map.plotPlaces(userInterface.getOwnedPlaces(), 'USER_FLTR');
    }

    filterBtn.toggleClass('active');

  }

  function handleFriendPlaceFilter(evt) {

    var filterBtn = $(evt.target);
    if (filterBtn.hasClass('active')) {
      map.clearMarkers(function(marker) {
        return (marker.setBy === 'FRIEND_FLTR') ? true : false;
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
      if (target.hasClass('accept')) {
        userInterface.acceptRequest(friendId).then(function(friend) {
          console.log('accepted!');
          notifications.removeItem(friendId);
          friendController.addItem(friend);
        }, setMessage.setConsole);
      }
      else {

        userInterface.rejectRequest(friendId).then(function(friend) {
          console.log('rejected!');

          notifications.removeItem(friendId);
        }, setMessage.setConsole);

      }

    }


  }

  function handleRemoveFriend(evt) {

    var target = $(evt.target);
    var friendId = target.attr('friend_id');

    userInterface.removeFriend(friendId).then(function(msg) {

      friendController.removeItem(friendId);

    }, setMessage.setConsole);


  }

  function handleShowFriends(evt) {


    $(".friend--overlay").toggleClass('hide');
    // $('.friend--overlay').siblings().each(
    //   function(i, node) {
    //     $(node).toggleClass('blur');
    //   }
    // );

  }

  function handleFriendFilterInput(evt) {

    if (evt.keyCode === 13) return handleFriendAdd(evt);

  }

  function handleFriendAdd(evt) {


    var friendUsername = $('.friend--filter').val();

    if (!friendUsername) return setMessage.setGeneric('#requestStatus', 'No Friend username?');

    var username = $('#username').text();

    if (username === friendUsername) return setMessage.setGeneric('#requestStatus', "Can't add urself :/");

    userInterface.sendRequest(friendUsername).then(function(msg) {
      setMessage.setGeneric('#requestStatus', 'Request sent :D');
    }, function(err) {
      console.log(err);
      setMessage.setGeneric('#requestStatus', err.responseJSON.message);
    });

  }

  function handleLogout(evt) {


    userInterface.logout().then(function(msg) {
      window.location = 'http://localhost:3000/';
    }, function(err) {
      console.log(err);
    });

  }

  // registers global event handlers
  function registerHandlers() {
    // search submit button => excecute search
    document.getElementById('placesSearchSubmit').addEventListener('click', handleSearchSubmit);
    document.getElementById('placeSearchInput').addEventListener('keyup', handleSearchInput);


    // NEW
    document.getElementById('showFriends').addEventListener('click', handleShowFriends);
    document.getElementById('friendFilterInput').addEventListener('keyup', handleFriendFilterInput);
    document.getElementById('addFriendSubmit').addEventListener('click', handleFriendAdd);
    ///////

    // document.getElementById('addFriendSubmit').addEventListener('click', handleRequestSubmit);

    document.getElementById('filterMyPlaces').addEventListener('click', handleMyPlaceFilter);
    document.getElementById('filterFriendPlaces').addEventListener('click', handleFriendPlaceFilter);

    document.getElementById('openMail').addEventListener('click', handleOpenMail);
    document.getElementById('closeMail').addEventListener('click', handleOpenMail);
    document.getElementById('notifications').addEventListener('click', handleReqAction);


    // *************NEEDS ATTENTION***************
    $(".friend--remove").click(handleRemoveFriend);
    $('.logout--btn').click(handleLogout);

  }

  initialize();

});
