// Main frontend JS file.

// !-- NOTE: The whole application doesn't need to be wrapped
// !-- in the 'ready' function. Could maybe wrap the 'registerHandlers'
// !-- function, and have code set the nodes for the services/controllers as well?
// !-- What would the best way to avoid having lots of global variables, would it be
// !-- better to have them wrapped in an 'app' object or something?
$(document).ready(function() {

  // register variables for global access
  // !-- NOTE: Feels like there are lots of variables here...
  var map; // !-- NOTE: not a great name.
  var searchServices;
  var searchTextBox;
  var userInterface;
  var prefetchResults;
  var notifications;
  var friendController;
  var setMessage;


  // function called on app load, used to set all global vairables
  // and initalize the application.
  function initialize() {

    // used to centralize setting messages
    setMessage = new messageService();

    // sets up interface for user account to interact with user routes
    userInterface = new UserInterface();

    // Load google map interface & map on element w/ id 'map'.
    map = new MapArea("map");

    // Centralize interface w/ google services.
    searchServices = new SearchServices(map.map);

    // caches search box node
    searchTextBox = $("#placeSearchInput");

    // sets up predictive search & binds 'predictiveContainer'
    prefetchResults = new PrefetchResults("#predictiveContainer");

    // binds controller to update notifications
    notifications = new notificationController("#notifications");

    // binds conroller to handle actions regarding friends
    friendController = new FriendController("#friendList");

    // register global event handlers
    registerHandlers();

  }


  // generic class used to set messages to nodes
  // or log to console. Most often used in callbacks.
  // !-- NOTE: Feels like this might not need to be it's own class
  function messageService() {

   
    // sets the text of some selector, and clears it
    // after 5 seconds. Only works for single-node selectors
    this.setGeneric = function(selector, text) {
      var node = $(selector);

      node.text(text);
      setTimeout(function() {
        node.text('');
      }, 5000);
    };

    // logs data to console. Used mostly in promsie rejection handlers
    this.setConsole = function(data) {
      console.log(data);
    };

  }


  // class used to provide an interface to the 'user' object.
  // Uses AJAX calls to push changes & pull data to '/user/*' routes
  // !-- NOTE: Not sure how well structured this is. Should it be broken
  // !-- down into more objects?
  // !-- It seems like this could also be it's own file.
  function UserInterface() {

    // initalization function makes the inital call
    // to pull user info from the DB.
    this.init = function() {
      $.get('/user/getUser').success(function(data) {
        console.log('got user', data);
        this.user = data;
      }.bind(this)).error(setMessage.setConsole);
    };


    // getter function for userId field
    // !-- NOTE: is this necessary? Included
    // !-- in case id attribute changes later
    this.getUserId = function() {
      return this.user.id;
    };

    
    // getter function for a users saved place list
    this.getOwnedPlaces = function() {
      return this.user.ownedPlaces;
    };


    
    // getter function for a users friends saved places
    this.getFriendPlaces = function() {
      return this.user.friendsPlaces;
    };

    
    // helper function used to determine if a user
    // has a specific place saved.
    // !-- NOTE: could be imporved by using binary search
    this.hasPlace = function(place_id) {

      for (var i = 0; i < this.user.ownedPlaces.length; i++) {
        if (this.user.ownedPlaces[i].place_id === place_id) return true;
      }

      return false;

    };


    // function used to save a place to a users db entry.
    // POSTS a 'place' object to the '/addPlace' route
    // returns a promise that will resolve on success.
    // !-- NOTE: feels like maybe some sort of generator
    // !-- could have been used to reduce repetative code w/ other 
    // !-- AJAX call methods like removePlace? Also, is a promise really needed here?
    this.savePlace = function(place) {

      return (new Promise(function(res, rej) {

        // post place, then update 'ownedPlaces' to whatever the server returns
        // which will be a new place list. then resolve.
        // !-- NOTE: success/error functions should be abstracted out
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


    // function used to remove a place from a users db entry.
    // POSTS a 'place' object to the '/removePlace' route
    // returns a promise that will resolve on success.
    // !-- NOTE: route should only need place ID.
    this.removePlace = function(place) {

      return (new Promise(function(res, rej) {

        // post place, then update 'ownedPlaces' to whatever the server returns
        // which will be a new place list. then resolve.
        // !-- NOTE: success/error functions should be abstracted out?
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


    // function used to post a friend request to the friends
    // db entry. POSTS to '/addRequest' route and just resolves on OK.
    // !-- NOTE: user's request data is populated server side, should it be
    // !-- generated here first, then error checked?
    this.sendRequest = function(friendUsername) {

      // post request, resolve on OK
      // !-- NOTE: these success/error functions should be generalized
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


    // function used to remove a friend request from a the user's accont.
    // Removes the request based on friend's Id. POSTS to '/removeFriend'
    // and resolves on OK.
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


    // function used to accept a friend request and therby add the friend
    // to the users friend list. POSTS friend ID to '/acceptRequest'
    // and resolves on OK.
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


    // function used to remove a friend request. POSTS friend ID to '/removeRequest'
    // and resolves on OK.
    // !-- NOTE: name should probably match route
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


    // a function used to log a user out. POSTS to
    // '/logout' and the server removes their authentication
    this.logout = function() {

      return (new Promise(function(res, rej) {

        $.post('/user/logout').success(function(msg) {
          res(msg);
        }).error(function(err) {
          rej(err);
        });

      }));

    };


    // call the init function
    // !-- NOTE: should this pattern be applied to other objects?
    this.init();

  }


  // Holds functions related to using google search services
  // Used to provide a central location for using search services.
  // Takes a Google Maps node as it's argument
  function SearchServices(map) {

    // initalize connection with google places + set relevant map
    this.placeServiceConn = new google.maps.places.PlacesService(map);

    // reference to map node
    this.map = map;

    // function for building basic search requests
    this.buildSearchRequest = function(keyword) {

      // set search location to center of map
      var lat = this.map.getCenter().lat();
      var lng = this.map.getCenter().lng();

      // !-- NOTE: radius should scale with zoom level.
      return ({
        location: new google.maps.LatLng(lat, lng),
        radius: '1200',
        keyword: keyword
      });
    };

    // function used to execute a 'nearbySearch' based on keywoord. 
    // Returns a promise that will resolve on 'OK' or 'ZERO_RESULTS'.
    this.nearbySearch = function(keyword) {

      // build search request
      var req = this.buildSearchRequest(keyword);

      return (new Promise(function(res, rej) {
        this.placeServiceConn.nearbySearch(req, function(data, status) {
          if ((status === google.maps.places.PlacesServiceStatus.OK) || (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS)) {
            res(data);
          } else {
            rej(data);
          }
        });
      }.bind(this)));
    };


  }


  // used to manage info windows on a given map.
  // Allows for creating, opening, closing, and clearing info
  // windows that can be associted with map markers.
  // !-- NOTE: This is kinda specific, really only generating markers
  // !-- for place markers. 
  function InfoWindow(map) {

    // register map
    this.map = map;

    // set 'pane' to an instance of a Google Maps info window class
    this.pane = new google.maps.InfoWindow();

    // keeps track of the last open window by storing the place ID
    // of whatever marker was clicked last.
    this.lastOpen = null;

    // list of classes used for the info window
    // !-- NOTE: should have the templates populate from this as well
    this.classes = {
      actionBtn: {
        main: 'place--save--btn',
        save: 'save',
        remove: 'remove'
      }
    };

    // HTML templates used for the info window.
    // Uses '%%' wrapped strings as placeholders
    // !-- NOTE: 'btnDOMQuery' should not be here. Also the above should be
    // !-- wrapped in a init function.
    this.templates = {
      actionBtn: {
        save: '<button class="place--save--btn %%BTN_CLASS_ACTION%%" place_id="%%PLACE_ID%%">Save</button>',
        remove: '<button class="place--save--btn %%BTN_CLASS_ACTION%%" place_id="%%PLACE_ID%%">Remove</button>'
      },
      savedBy: '<span class="place--marker--saved">Saved By: %%SAVE_LIST%%</span>',
      mainContainer: '<div><span class="place--marker--title">%%PLACE_NAME%%</span><hr/>%%SAVED_BY%%<hr/>%%ACTION_BTN%%</div>',
      btnDOMQuery: '.%%BTN_CLASS%%[place_id="%%PLACE_ID%%"]'
    };


    // function used to build 'save/remove' place buttons.
    // returns button HTML based on if a user
    // has a place saved or not.
    this.buildActionButton = function(place) {

      // if place is saved, return remove button, otherwise return save button.
      // !-- NOTE: Should this check be here or elsewhere? 
      if (userInterface.hasPlace(place.place_id)) {
        return this.templates.actionBtn.remove.replace('%%BTN_CLASS_ACTION%%', this.classes.actionBtn.remove);
      } else {
        return this.templates.actionBtn.save.replace('%%BTN_CLASS_ACTION%%', this.classes.actionBtn.save);
      }
    
    };

    // function used to populate the 'saved by'
    // HTML string. Will return a formatted list of friends who've saved
    // the place, or nothing if no friends have.
    this.buildSavedBy = function(place) {

      return (place.savedBy) ? this.templates.savedBy.replace('%%SAVE_LIST%%', place.savedBy.join(', ')) : '';

    };


    // function used to generate a places info window HTML.
    // first builds the button/saved by, then populates the main container
    // with place information.
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


    // function used to refresh a windows action button.
    // mainly used to toggle the button after it's clicked.
    // accepts a button node, and a Google Maps place
    this.refreshActionButton = function(node, place) {

      // build action button
      var btn = $(this.buildActionButton(place));

      // generate and associate event handler
      btn.on('click', this.generateActionClickHandler(place));

      // replace button
      node.replaceWith(btn);

    };


    // function used to handle the 'save' or 'remove' button
    // click. Will call the appropriate userInterface method
    // based on if the button has the 'save' class.
    // !-- NOTE: I think the action should call 'hasSavedPlace'
    // !-- instead of relying on the 'save' class
    this.handleActionClick = function(evt, place) {

      var node = $(evt.target);

      // if has class 'save', save place, else remove.
      // refresh action button after action completed
      // log message if error.
      if (node.hasClass('save')) {
        userInterface.savePlace(place).then(function(msg) {

          this.refreshActionButton(node, place);

        }.bind(this), setMessage.setConsole);
      } else {

        userInterface.removePlace(place).then(function(msg) {

          this.refreshActionButton(node, place);

        }.bind(this), setMessage.setConsole);

      }
    };


    // used to generate 'handleActionClick' handlers for save/remove
    // buttons. Creates a closure(?) that preserves the 'place' object
    // refernce so if saved, the handler still has access to the full place object
    this.generateActionClickHandler = function(place) {
      return (function(evt) {

        this.handleActionClick(evt, place);

      }.bind(this));
    };


    // calls 'generateActionClickHandler' and associates the click hander
    // with the info window's action button. Uses 'btnDOMQuery' to look
    // up the button node.
    // !-- NOTE: I feel like there's a better way to do this.
    this.createHandler = function(place) {

      return (function() {

        var query = this.templates.btnDOMQuery
          .replace('%%BTN_CLASS%%', this.classes.actionBtn.main)
          .replace('%%PLACE_ID%%', place.place_id);

        var node = $(query);
        $(node).on('click', this.generateActionClickHandler(place));

      }.bind(this));

    };

    // function used to open an info window when a marker is clicked.
    // Checks if
    // !-- NOTE: have this take 'position' instead of full 'marker' object?
    // !-- Should also be 'togglePane', with the controls for 'open' in another
    // !-- function.
    this.openPane = function(place, marker) {

      // if pane is open and is the last opened marker, close it.
      if ((this.open) && (this.lastOpen == place.place_id)) return this.closePane();

      // build content for pane
      var content = this.buildInfoWindow(place);

      // set content and open pane
      this.pane.setContent(content);
      this.pane.open(this.map, marker);

      // build and associate click handler for save/remove button
      // when info window is dom ready
      google.maps.event.addListener(this.pane, 'domready', this.createHandler(place));

      // register last opened marker and set state to open
      this.lastOpen = place.place_id;
      this.open = true;

    };


    // function used to close an open pane
    // and set open state to false
    this.closePane = function() {
      this.open = false;
      this.pane.close();
    };

  }


  // used to hold all the functions related to map operations
  // or marker placements. Takes an element ID to load the Google Map to
  // !-- NOTE: Markers should probably be placed into their own class.
  // !-- I think there's lots of opporinity for improvement in general here.
  function MapArea(ID) {

    // initalization function. Loads map and sets
    // center
    this.init = function() {

      // set map container attribute to the node with the ID provided.
      this.mapContainer = document.getElementById(ID);

      // set fallback starting point for map
      this.fallbackStartLatLng = new google.maps.LatLng(34.024457, -118.445977);

      // create new map on 'map' attribute. 0,0 center, and very zoomed out
      // as location is set later.
      // !-- NOTE: Having the generic 'map' keyword appear multiple times
      // !-- in different contexts is confused. Should rename
      this.map = new google.maps.Map(this.mapContainer, {
        center: new google.maps.LatLng(0, 0),
        zoom: 2,
        scrollwheel: true,
        disableDefaultUI: false,
        mapTypeControl: false
      });

      // set active markers array to empty.
      this.activeMarkers = [];

      // try using geolocation to set map center, if unable
      // use the default of my house. pulled from google map docs.
      // !-- NOTE: 'No Geo location' should be handled better.
      // !-- At least show a visable message or something.
      // !-- should also have the ability to retry 'locate me'
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {

          // Set center and zoom.
          // !-- NOTE: could pull out into a seperate 'setLocation' function
          var initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          this.map.setCenter(initialLocation);
          this.map.setZoom(15);

        }.bind(this), function() {
          // console.error("FAILED TO INIT GEOLOCATION SERVICE");

          // Set center and zoom.
          this.map.setCenter(this.fallbackStartLatLng);
          this.map.setZoom(15);

        }.bind(this));
      } else {
        // console.error("BROWSER DOESN'T SUPPORT GEO LOCATION");

        this.map.setCenter(this.fallbackStartLatLng);
        this.map.setZoom(15);
      }

      // Create new info window instance and associate with the map
      this.infoWindow = new InfoWindow(this.map);

    };


    // function used to generate markers, takes a map and
    // a place, and returns a new Google Maps marker object.
    this.generateMarker = function(place, map) {
      return (new google.maps.Marker({
        map: this.map,
        position: place.geometry.location,
        title: place.name
      }));
    };

    // function used to check if an active marker exists for a given
    // place object.
    // !-- NOTE: should probably be refactored to only accept a 
    // !-- place Id since that's all that's used.
    this.markerIsActive = function(place) {
      for (var i = 0; i < this.activeMarkers.length; i++) {
        if (this.activeMarkers[i].place_id === place.place_id) return true;
      }
      return false;
    };

    // function used to place a marker on the map.
    // Accepts a google maps place object, a map, and a 'setby' argument
    // that will be added to the marker for clearing purposes
    this.placeMarker = function(place, map, setBy) {

      // check if map already has active marker for place.
      if (this.markerIsActive(place)) return;

      // generate a marker for the place + associate map
      var marker = this.generateMarker(place, map);

      // add custom attributes to marker for use
      // in other parts of the application
      // !-- NOTE: I'm not sure if these belong here.
      marker.setBy = setBy;
      marker.place_id = place.place_id;

      // place.setby is set on the server and will only 
      // appear on markers that a users friends have saved.
      marker.savedBy = place.savedBy;

      // add an event listener to open the info window
      // when the marker is clicked.
      marker.addListener('click', function() {
        this.infoWindow.openPane(place, marker);
      }.bind(this));

      // push the marker to the active marker array.
      this.activeMarkers.push(marker);
    };


    // function used to set map on all active markers (or filtered subset of all)
    // Used mainly for showing/hiding markers
    this.setMapOnAll = function(map, filter) {

      // if no filter is provided, default to all items
      filter = filter || function(item) {
        return true;
      };

      // loop through active markers
      for (var i = 0; i < this.activeMarkers.length; i++) {

        // test with filter function, and set map if filter returns true
        if (filter(this.activeMarkers[i])) this.activeMarkers[i].setMap(map);
      }

    };


    // function used to clear markers from map. Accepts optional filter
    // to test if marker should be removed. Defaults to removing all markers.
    // !-- NOTE: should probably have the default filter set here.
    // !-- Dangerous default?
    this.clearMarkers = function(filter) {

      // if no filter is provided, default to all items
      filter = filter || function(item) {
        return true;
      };

      // set map to null for all markers that match the filter
      this.setMapOnAll(null, filter);

      // reduce activeMarkers, removing those that don't match the filter
      // !-- NOTE: could use 'filter' instead of 'reduce' here
      this.activeMarkers = this.activeMarkers.reduce(function(cur, marker) {
        return (filter(marker)) ? cur : cur.concat(marker);
      }, []);

    };


    // function used to clear markers set through searches
    // clears markers with 'setBy' of 'SEARCH_SVC'
    this.clearSearchPlaces = function() {

      this.clearMarkers(function(marker) {
        return (marker.setBy === 'SEARCH_SVC') ? true : false;
      });

    };


    // function used to plot a list of place objects.
    // calls 'placeMarker' for each place passed to it.
    // Works for a single place or an array of places.
    this.plotPlaces = function(places, setBy) {

      // test if array or single object. plot place and return if single
      if (Object.prototype.toString.call(places) === '[object Object]') return this.placeMarker(places, this.map, setBy);

      // else plot place marker for each place in array
      places.forEach(function(place) {
        this.placeMarker(place, this.map, setBy);
      }.bind(this));

    };


    // helper function used to plot search places.
    // Automatically sets 'setBy' to 'SEARCH_SVC'
    this.plotSearchPlaces = function(res) {

      this.plotPlaces(res, 'SEARCH_SVC');

    };

    // run init on first call
    this.init();

  }


  // Used to  manage the HTML for the prefetch search results.
  // Handles sending data to 'searchServices' and populating results
  // Will append <li> results as children to the 'selector' node
  function PrefetchResults(selector) {
    
    // bind results container + set initial loading state
    // !-- NOTE: should be wrapped in an init function
    this.resultContainer = $(selector);
    this.loading = false;


    // !-- NOTE set templates for HTML formatting
    this.templates = {
      mainContainer: '<li place_id="%%PLACE_ID%%">%%PLACE_NAME%%</li>',
      noResults: '<li>No Results :/</li>'
    };


    // function used to toggle loading. Expects the first item
    // of the results container to be the loading indicator and toggles
    // class 'hide'
    // !-- NOTE: should not expect the first li item to be the loading indicator.
    this.toggleLoading = function() {
      this.resultContainer.children('li:first').toggleClass('hide');
      this.loading = !this.loading;
    };


    // function used to clear the results container.
    // Doesn't remove first child as it's excpected to be the 
    // loading indicator
    // !-- NOTE: again, shouldn't expect loading indicator
    this.clear = function() {
      this.resultContainer.children().not('li:first').remove();
    };


    // function used to append an HTML string to the
    // results contianer
    this.set = function(htmlToAdd) {
      this.resultContainer.append(htmlToAdd);
    };


    // function used to populate the raw HTML string
    // with result specific information. Returns formatted
    // HTML string
    this.buildItem = function(place) {
      return (this.templates.mainContainer
        .replace('%%PLACE_ID%%', place.place_id)
        .replace('%%PLACE_NAME%%', place.name));
    };


    // used to handle the click action when the user
    // clicks a search result. Relies on closures(?) to 
    // pull correct place information.
    this.handleResultClick = function(evt, place) {

      // if node has 'place_id' attr, it's a search result, and we can plot it.
      // !-- NOTE: does it ever not have a 'place_id' attr? Is that attr
      // even needed anymore?
      if ($(evt.target).attr('place_id')) map.plotSearchPlaces(place);

    };

    // generates the closure(?) for the result click handler.
    // Alows full place object to passed for plotting.
    this.generateResultClickHandler = function(place) {
      return (function(evt) {

        this.handleResultClick(evt, place);

      }.bind(this));
    };


    // function used to set the results of the search
    // into the results container. Expects 'data' to be
    // an array of Google Map places.
    this.setResults = function(data) {

      // if there are no results returned, set the 'no result' item and return
      if (data.length === 0) return this.set(this.templates.noResults);

      // set a marker for each place in 'data'
      data.forEach(function(place) {

        // build HTML for place
        var listItem = $(this.buildItem(place));

        // generate a handler for the list item
        listItem.on('click', this.generateResultClickHandler(place));

        // add item to container
        this.set(listItem);

      }.bind(this));

    };


    // a function used to load a google search result 
    // and populate the container.
    // !-- NOTE: should split into seperate getting and setting
    // !-- functions. Reload only when search is done or 
    // !-- when time since last keypress > threshold? 
    this.fetch = function(keyword) {

      // loading
      this.toggleLoading();

      // start search
      searchServices.nearbySearch(keyword).then(function(data, status) {

        // on success toggle load
        this.toggleLoading();

        // clear previous results
        this.clear();

        // set new results using the place list
        this.setResults(data);

      }.bind(this), function(err) {

        // on failure toggle load
        this.toggleLoading();

        // set results to an empty array.
        this.setResults([]);
      }.bind(this));
    };

  }


  // a controller for the friend view. Is mainly used by
  // event handlers for adding/removing friends to the view.
  function FriendController(node) {

    // cache the container node.
    this.friendContainer = $(node);

    // import the html template
    // !-- NOTE: breaks previous convention, uses a dependency,
    // !-- does this need to be outside addItem?
    this.itemTemplate = $("#friendTemplate").html();


    // adds a friend to the view. Expects a friend object
    // to populate from.
    // !-- NOTE: should break up into functions. lacks
    // !-- transparency into the templates html.
    this.addItem = function(friend) {

      // populate the html template using the friend object
      var rawHTML = this.itemTemplate.replace("%%USERNAME%%", friend.username)
        .replace("%%FNAME%%", friend.firstName)
        .replace("%%LNAME%%", friend.lastName)
        .replace("%%PLACE_COUNT%%", friend.placeCount)
        .replace("%%FRIEND_ID%%", friend.userId);

      // convert to jquery object for click handler
      // !-- NOTE: excessive?
      var toAdd = $(rawHTML);

      // add click handler on button
      // !-- NOTE: query seems dangerous
      toAdd.children('button.friend--remove[friend_id="' + friend.userId + '"]').click(handleRemoveFriend);

      // if the item is the users first friend, add it a hide class to the 
      // 'no friends' item
      // !-- NOTE: shouldn't expect last child to be no friends.
      // !-- should also be it's own toggle function
      if (this.friendContainer.children().length === 1) {
        this.friendContainer.children().last().addClass('hide');
      }

      // prepend html to friend list
      this.friendContainer.prepend(toAdd);
     

    };


    // function to remove a friend item using a friend Id.
    this.removeItem = function(friendId) {

      // locate the remove button that was clicked
      var btn = $('.friend--remove[friend_id="' + friendId + '"]');

      // remove it's corresponding friend item entry
      btn.parentsUntil('ul')[0].remove();

      // if there is only the 'no friends' item, remove it's hide class
      // !-- NOTE: shouldn't expect last child to be no friends.
      // !-- should also be it's own toggle function
      if (this.friendContainer.children().length === 1) {
        this.friendContainer.children().last().removeClass('hide');
      }

    };

  }


  // used to show/hide, or remove notifications from the view
  // binds to the request container node 
  // !-- NOTE: Has lots of external dependencies that should be 
  // !-- removed. Class is generally not very flexible.
  // !-- seems very functionally similar to the friend controller.
  // !-- should maybe be split into seperate 'button' + 'container' controllers?
  function notificationController(node) {

    // cache reference to container node
    this.requestContainer = $(node);

    // cache reference to "no request" item
    // and the 'icon' image.
    // !-- NOTE: having hardcoded classes here seems wrong
    this.noRequests = $('.friend--request.empty');
    this.iconContainer = $('.mail--img');

    // get request count
    // !-- NOTE: should use 'userInterface' as this is dirty.
    // !-- -2 to account for the 'no requests' + 'close window' item.
    // !-- should not have to do that
    this.reqCount = this.requestContainer.children().length - 2;

    // function used to remove a request item from the container.
    // Looks up item via request Id and removes accordingly
    this.removeItem = function(requestId) {

      // Build query using request Id
      // !-- NOTE: again, doesn't feel right
      var query = "li[request_id='%%REQ_ID%%']".replace('%%REQ_ID%%', requestId);

      // remove request
      this.requestContainer.children(query)[0].remove();

      // decrement request count
      // !-- NOTE: should use 'userInterface'
      this.reqCount--;

      // if no more requests, toggle active state.
      if (this.reqCount === 0) this.toggleRequestActive();
    };

    // function used to set the state to inactive.
    // Changes classes that affect the view
    // !-- NOTE: should be converted into a toggle
    this.toggleRequestActive = function() {

      // !-- NOTE: should toggle a single class
      this.iconContainer.removeClass('active');
      this.iconContainer.addClass('inactive');

      // show 'no request' item
      this.noRequests.removeClass('hide');

      // close container
      this.toggleRequestVisibilty();

    };

    // function used to toggle the containers visibility.
    // Toggles 'hide' class on container.
    this.toggleRequestVisibilty = function() {
      this.requestContainer.toggleClass('hide');
    };



  }


  // function used to handle map serach submits
  // pulls value from search input and uses
  // searchServices to execute the search
  // populates result markers using 'map' class.
  function handleSearchSubmit(evt) {

    var searchTerm = searchTextBox.val();

    // exectue search with search term.
    // on success, clear old search places, and plot new
    // on fail, console log message.
    searchServices.nearbySearch(searchTerm).then(function(data) {

      map.clearSearchPlaces();

      // plot places and set 'setBy' to 'SEARCH_SVC' for clearing
      map.plotPlaces(data, 'SEARCH_SVC');

    }, setMessage.setConsole);

  }


  // function used to handle inputs into the
  // search textbox. Used mainly for prefetching
  // search results.
  function handleSearchInput(evt) {


    // if key is 'enter' pass to 'handleSearchSubmit'
    if (evt.keyCode === 13) {
      return handleSearchSubmit(evt);
    }

    // get search term
    var searchTerm = searchTextBox.val();

    // if search term is 0, clear all prefetch results
    // and map search markers
    if (searchTerm.length === 0) {
      prefetchResults.clear();
      map.clearSearchPlaces();
    }

    // start searching when term is >= 2 chars
    if (searchTerm.length >= 2) return prefetchResults.fetch(searchTerm);

  }


  // function handles toggling visibility for
  // saved places on the map
  // !-- NOTE: could be converted into a generator
  // !-- and used with friend filters
  function handleMyPlaceFilter(evt) {

    // find button theb check for class
    // !-- NOTE: JQuery shouldn't really be needed here
    var filterBtn = $(evt.target);

    // if was active, clear all users saved places
    // otherwise plot all places.
    // !-- NOTE: should manage state better
    if (filterBtn.hasClass('active')) {

      // clear markers set by 'USER_FLTR'
      map.clearMarkers(function(marker) {
        return (marker.setBy === 'USER_FLTR') ? true : false;
      });

    } else {

      // plot markers, set group owner to 'USER_FLTR'
      map.plotPlaces(userInterface.getOwnedPlaces(), 'USER_FLTR');
    }

    // toggle active state
    filterBtn.toggleClass('active');

  }

  // function handles toggling visibility for
  // friends saved places on the map
  // !-- NOTE: similar to 'handleMyPlaceFilter' notes
  function handleFriendPlaceFilter(evt) {

    var filterBtn = $(evt.target);
    if (filterBtn.hasClass('active')) {

      // clear markers set by 'FRIEND_FLTR'
      map.clearMarkers(function(marker) {
        return (marker.setBy === 'FRIEND_FLTR') ? true : false;
      });

    } else {

      // plot markers, set group owner to 'FRIEND_FLTR';
      map.plotPlaces(userInterface.getFriendPlaces(), 'FRIEND_FLTR');

    }

    // toggle active state
    filterBtn.toggleClass('active');

  }



  // function used to toggle notficiation visibility.
  // !-- NOTE: don't think this is really needed.
  // !-- could just use the function as the callback?
  function handleOpenMail(evt) {

    notifications.toggleRequestVisibilty();

  }


  // function used to determine and dispatch a friend request
  // action from an event. determines if target element is a 
  // request action button and if so, what action to take.
  // !-- NOTE: What's a better way to manage this?
  // !-- Seperate functions + event handlers? 
  function handleReqAction(evt) {

    // cache target element
    var target = $(evt.target);

    // if target is a mail filter button, determine and execute action
    // !-- NOTE: classes don't seem like the best way to do this
    if (target.hasClass('mail--btn')) {

      // get friend id from request's html
      var friendId = $(target.parent()).attr('friend_id');
      
      // if target's an accept button
      // otheriwse reject
      // !-- NOTE: should be else if 'reject' else nothing.
      // !-- again, classes. not super flexible
      if (target.hasClass('accept')) {

        // accpet request through userinterface
        // !-- NOTE: perhaps create a requestInterface replacement class?
        userInterface.acceptRequest(friendId).then(function(friend) {
  
          // remove request (notification) from view
          notifications.removeItem(friendId);

          // add friend item to view
          friendController.addItem(friend);

           // set console on fail
        }, setMessage.setConsole);
      }

      // if not 'accept' button
      else {

        // reject the request through userInterface
        userInterface.rejectRequest(friendId).then(function(friend) {

          // remove friend item from view
          notifications.removeItem(friendId);

        }, setMessage.setConsole);

      }

    }


  }


  // function used to send a request to a user.
  // pulls friend username from search textbox,
  // validates, sends request and handles
  // !-- NOTE: confusing/misleading name. seems like 
  // !-- it could be broken up into smaller functions.
  // !-- what would be better? could also cache the textbox node?
  function handleFriendAdd(evt) {

    // pull friend username to search for
    var friendUsername = $('.friend--filter').val();

    // if no name, set message to node '#requestStatus'
    // !-- NOTE: don't like this message pattern, could maybe replace with a
    // !-- sort of error handling class?
    if (!friendUsername) return setMessage.setGeneric('#requestStatus', 'No Friend username?');

    // get user adding's username
    var username = $('#username').text();

    // if you're adding yourself, set error on '#requestStatus'
    // verified server side
    if (username === friendUsername) return setMessage.setGeneric('#requestStatus', "Can't add urself :/");

    // send request through userInterface set message on error/success
    // !-- Again, maybe a requestInterface as well?
    userInterface.sendRequest(friendUsername).then(function(msg) {

      // success message 
      setMessage.setGeneric('#requestStatus', 'Request sent :D');

    }, function(err) {
      
      // error message
      setMessage.setGeneric('#requestStatus', err.responseJSON.message);

    });

  }

  // function used to remove a friend.
  // expects a target element with 'friend_id' attribute.
  // !-- NOTE: could use bubbling like with 'handleReqAction'
  function handleRemoveFriend(evt) {

    // cache target and pull 'friend_id' attribute
    var target = $(evt.target);
    var friendId = target.attr('friend_id');

    // remove the friend through userInterface
    userInterface.removeFriend(friendId).then(function(msg) {

      // remove the firend item from the view on success
      friendController.removeItem(friendId);

    }, setMessage.setConsole);


  }


  // function used to toggle the friend overlay
  // !-- NOTE: maybe shouldn't have a hard coded class name
  function handleShowFriends(evt) {

    $(".friend--overlay").toggleClass('hide');

  }


  // function used with the friend textbox to
  // add friends on enter key press.
  function handleFriendFilterInput(evt) {

    // if target keypress was enter, add friend (push request to)
    if (evt.keyCode === 13) return handleFriendAdd(evt);

  }

  
  // function used to handle log out calls
  // logs user out then redirects to homepage
  function handleLogout(evt) {

    // logout through user interface then redir to home
    // !-- NOTE: don't like the absolute reference to the domain.
    // !-- could replace with an html form + server redirect?
    userInterface.logout().then(function(msg) {
      window.location = 'http://localhost:3000/';
    }, setMessage.setConsole);

  }

  // registers global event handlers
  // !-- NOTE: handlers could be organized better and I think
  // !-- they carry too much responsibility.
  function registerHandlers() {

    // place search submit button click => excecute search and place map markers
    document.getElementById('placesSearchSubmit').addEventListener('click', handleSearchSubmit);

    // place search input box keystorke => prefetch results or submit search if enter
    document.getElementById('placeSearchInput').addEventListener('keyup', handleSearchInput);

    // show friends button click => toggle friend overlay 
    document.getElementById('showFriends').addEventListener('click', handleShowFriends);

    // friend search input box keystroke => send request to friend if enter
    // !-- NOTE: 'friendFilterInput' is confusing. It's the username input
    document.getElementById('friendFilterInput').addEventListener('keyup', handleFriendFilterInput);

    // friend add button click => send request to friend
    document.getElementById('addFriendSubmit').addEventListener('click', handleFriendAdd);

    // filter my places button click => toggle my places map markers
    document.getElementById('filterMyPlaces').addEventListener('click', handleMyPlaceFilter);

    // filter friend places button click => toggle friend places map markers
    document.getElementById('filterFriendPlaces').addEventListener('click', handleFriendPlaceFilter);

    // open requests button (mail icon) click => toggle request visibility
    // !-- NOTE: 'mail' is confusing. It's for friend requests, not mail.
    document.getElementById('openMail').addEventListener('click', handleOpenMail);

    // close requests button click => toggle request visibility
    document.getElementById('closeMail').addEventListener('click', handleOpenMail);

    // request item click => if button, determine and dispatch request action
    // !-- NOTE: 'notifications' is somewhat confusing
    document.getElementById('notifications').addEventListener('click', handleReqAction);


    // on friend 'x' button click => remove friend
    // !-- NOTE: would rather not use jQuery
    $(".friend--remove").click(handleRemoveFriend);

    // logout button click => log user out and redirect to homepage
    $('.logout--btn').click(handleLogout);

  }


  // call initialization function to start the app.
  initialize();

});
