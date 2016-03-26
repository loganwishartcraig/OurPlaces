$(document).ready(function() {

  // register variables for global access
  var map;
  var searchServices;
  var searchTextBox;
  var userInterface;
  var prefetchResults;
  var notifications;
  var setMessage;

  function initialize() {


    // sets up interface for user account
    userInterface = new UserInterface();

    // Load google map on element w/ id 'map'
    map = new MapArea("map");

    // Centralize interface w/ google services.
    searchServices = new SearchServices(map.map);

    // binds a textbox class to search box
    searchTextBox = new TextBox("#placeSearchInput");

    // sets up predictive search
    prefetchResults = new PrefetchResults("#predictiveContainer");

    // binds controller to update notifications
    notifications = new notificationController("#openMail");

    // used to centralize setting messages
    setMessage = new messageService();

    // register global event handlers
    registerHandlers();

  }

  function messageService() {

    this.requestSuccess = function() {

      var node = $('#requestStatus');

      node.text('Request Sent!');
      setTimeout(function() {
        node.text('');
      }, 5000);

    };

    this.setGeneric = function(selector, text) {
      var node = $(selector);

      node.text(text);
      setTimeout(function() {
        node.text('');
      }, 5000);
    };

  }

  function UserInterface() {

    this.init = function() {
      $.get('/user/getUser').success(function(data) {
        console.log('got user', data);
        this.user = data;
        this.registerPlaces();
      }.bind(this)).error(function(err) {
        console.log(err);
      }.bind(this));
    };

    this.hasPlace = function(place_id) {
      console.log(place_id, this.user.ownedPlaces.hasOwnProperty(place_id));
      return this.user.ownedPlaces.hasOwnProperty(place_id);
    };

    this.removePlace = function(placeId) {
      delete this.user.ownedPlaces[placeId];
    };

    this.addPlace = function(place) {
      this.user.ownedPlaces[place.place_id] = place;
    };

    this.sendRequest = function(friendUsername) {

      $.post('/user/addRequest', {
        friendUsername: friendUsername
      }).success(function(msg) {
        setMessage.requestSuccess();
      }).error(function(err) {
        console.log(err);
        setMessage.setGeneric('#requestStatus', err.responseJSON.message);
      });

    };

    this.getUserId = function() {
      return this.user.id;
    };

    this.removeFriend = function(friendId) {

      $.post('/user/removeFriend', {
        friendId: friendId
      }).success(function(msg) {
        setMessage.setGeneric('#requestStatus', 'Friend Deleted :(');
      }).error(function(err) {
        console.log(err);
        setMessage.setGeneric('#requestStatus', err.responseJSON.message);
      });

    };


    // *************NEEDS ATTENTION***************
    // - should be refactored into a 'get x' generator
    this.getMyPlaces = function() {

      var toReturn = [];

      console.log(this.user);
      Object.keys(this.user.ownedPlaces).forEach(function(item, index) {
        toReturn.push(this.user.ownedPlaces[item]);
      }.bind(this));

      return toReturn;
    };

    // *************NEEDS ATTENTION***************
    // - should be refactored into a 'get x' generator
    this.getFriendPlaces = function() {
      var toReturn = [];

      Object.keys(this.user.friendsPlaces).forEach(function(item, index) {
        toReturn.push(this.user.friendsPlaces[item]);
      }.bind(this));

      return toReturn;
    };

    this.getAllPlaces = function() {
      return this.getMyPlaces().concat(this.getFriendPlaces());

    };

    this.registerPlaces = function() {

      var toPlot = this.getAllPlaces();

      for (var i = 0; i < toPlot.length; i++) {
        map.placeMarker(toPlot[i], null);
      }

    };

    this.init();

  }

  // Holds functions related to using google search services
  // Used to provide a central location for using search services
  function SearchServices(map) {

    // initalize connection with google places + set relevant map
    this.placeServiceConn = new google.maps.places.PlacesService(map);

    this.map = map;

    // *************NEEDS ATTENTION***************
    // - should be more flexible, location should not be static.
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
    this.nearbySearch = function(keyword, cb) {
      var req = this.buildSearchRequest(keyword);
      this.placeServiceConn.nearbySearch(req, cb);
    }.bind(this);

    // executes a place detail search + calls callback
    this.placeDetails = function(placeId, cb) {
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
    this.buildActionBtn = function(place) {
      console.log('checking if saved...', userInterface.hasPlace(place.place_id));
      if (userInterface.hasPlace(place.place_id)) {
        return (this.btnTemplate.replace("{{BTN_CLASS}}", this.classes.remove).replace("{{PLACE_ID}}", place.place_id).replace("{{BTN_TEXT}}", 'Remove Place'));
      } else {
        return (this.btnTemplate.replace("{{BTN_CLASS}}", this.classes.save).replace("{{PLACE_ID}}", place.place_id).replace("{{BTN_TEXT}}", 'Save Place'));
      }
    };

    // function for formatting the template into useable HTML string
    this.buildInfoWindow = function(place) {

      var btn = this.buildActionBtn(place);

      var contentString = this.mainTemplate.replace("{{PLACE_ID}}", place.place_id)
        .replace("{{PLACE_NAME}}", place.name)
        .replace("{{ACTION_BTN}}", btn);

      return contentString;

    };

    this.rebuildInfoContent = function(place) {
      this.pane.setContent(this.buildInfoWindow(place));
    };

    // *************NEEDS ATTENTION***************
    // - could potentially use generators again here?
    // - maybe abstract out the success/error funcitons
    // function used when 'save place' button is clicked.
    // Posts place information to server & handles response
    this.savePlace = function(place) {
      console.log('saving! ' + place);
      var data = JSON.stringify(place);
      $.post('/user/addPlace', {
        place: data
      }).success(function(msg) {
        // on success, log message
        console.log(msg);
        userInterface.addPlace(place);
        this.rebuildInfoContent(place);
      }.bind(this)).error(function(err) {
        // on error, log error
        console.log(err);
      });
    };

    // *************NEEDS ATTENTION***************
    // - could potentially use generators again here?
    // - maybe abstract out the success/error funcitons
    this.removePlace = function(place) {
      console.log('removing! ' + JSON.stringify(place));
      var data = JSON.stringify(place);
      $.post('/user/removePlace', {
        place: data
      }).success(function(msg) {
        // on success, log message
        console.log(msg);
        userInterface.removePlace(place.place_id);
        this.rebuildInfoContent(place);
      }.bind(this)).error(function(err) {
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
    this.registerSaveHandler = function(place) {

      var query;

      if (userInterface.hasPlace(place.place_id)) {
        // finds element through class name + place_id attr selector
        query = '.' + this.classes.remove + "[place_id='" + place.place_id + "']";

        $(query).on('click', function() {
          this.removePlace(place);
        }.bind(this));
      } else {

        query = '.' + this.classes.save + "[place_id='" + place.place_id + "']";

        $(query).on('click', function() {
          this.savePlace(place);
        }.bind(this));
      }

    };


    // Builds the actual info window and sets 'domready'
    // function that registers a save handler for place when
    // content is DOM accessable
    this.setInfoWindow = function(place) {

      this.pane = new google.maps.InfoWindow({
        content: this.buildInfoWindow(place),
      });

      // only try to register save handler when content is ready
      google.maps.event.addListener(this.pane, 'domready', function() {
        this.registerSaveHandler(place);
      }.bind(this));
    };

    // function for toggling the window's visability.
    // sets map and location for window.
    this.toggleOpen = function() {
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
      }
      else {
        console.error("BROWSER DOESN'T SUPPORT GEO LOCATION");
        this.map.setCenter(this.fallbackStartLatLng);
        this.map.setZoom(15);
      }

    };

    this.generateMarker = function(place, map) {
      return (new google.maps.Marker({
        map: this.map,
        position: place.geometry.location,
        title: place.name
      }));
    };
    
    this.placeMarker = function(place, map, setBy) {
      console.log('PLACING MARKER')
      var marker = this.generateMarker(place, map);
          marker.setBy = setBy;
      var infoPane = new infoWindow(this.map, place, marker);
      marker.addListener('click', function() {
        infoPane.toggleOpen();
      });
      this.activeMarkers.push(marker);
    }.bind(this);
    
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

    this.plotPlaces = function(res, setBy) {
      for (var i = 0; i < res.length; i++) {
        this.placeMarker(res[i], this.map, setBy);
      }
      console.log(this.activeMarkers)
    }.bind(this);

//     this.execNearbySearch = function(searchTerm) {
//       console.log("executing search");
//       searchServices.nearbySearch(searchTerm, this.plotPlaces);
//     };

//     this.execSearchById = function(placeId) {
//       searchServices.placeDetails(placeId, this.plotSearchRes);
//     };


    // *************NEEDS ATTENTION***************
    // - GENERATORS.
    // - need to create some sort of internally managed array to keep track
    //   of markers so they can be toggled.
//     this.plotMyPlaces = function() {
//       var myId = userInterface.getUserId();
//       this.showMarkers(function(place) {
//         return (place.placeOwner === myId) ? true : false;
//       });
//     };

    // *************NEEDS ATTENTION***************
    // - GENERATORS.
//     this.plotFriendPlaces = function() {
//       var myPlaces = userInterface.getFriendPlaces();

//       for (var i = 0; i < Object.keys(myPlaces).length; i++) {
//         this.placeMarker(myPlaces[i]);
//       }
//     };

    this.init();

  }


  function TextBox(selector) {
    this.textArea = $(selector);

    this.getInput = () => {
      return this.textArea.val();
    };
    this.isEmpty = () => {
      return (this.textArea.val() === '');
    };
    this.length = () => {
      return (this.textArea.val().length);
    };
  }



  function PrefetchResults(selector) {
    this.resultContainer = $(selector);
    this.loading = false;

    this.createListItem = function(item) {
      item = item || {
        name: '',
        place_id: ''
      };
      var toAdd = $("<li place_id='" + item.place_id + "'></li>");
      toAdd.text(item.name);
      $(toAdd).on('click', function() {
        map.execSearchById(item.place_id);
      });
      return toAdd;
    };

    this.set = function(resultList) {
      console.log("setting");

      // %
      if (resultList.length !== 0) {
        resultList.forEach(function(item, index) {
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

    };

    this.clear = function() {
      console.log("clearing");
      this.resultContainer.children().not('li:first').remove();
    };

    this.toggleLoading = function() {
      console.log("toggling load");
      this.resultContainer.children('li:first').toggleClass('hide');
      this.loading = !this.loading;
    };

    this.fetch = function(searchTerm) {
      console.log("pulling");
      this.toggleLoading();
      searchServices.nearbySearch(searchTerm, function(data, status) {
        console.log("recieved data", status);
        this.clear();
        this.toggleLoading();
        if (status === google.maps.places.PlacesServiceStatus.OK) return this.set(data);
        if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) return this.set([]);
      }.bind(this));
    };
  }

  function notificationController(node) {

    this.container = $(node);
    this.requestContainer = $('.mail--items');

    this.decrement = function() {
      var countContainer = this.container.children('.mail--txt');
      var count = parseInt(countContainer.text(), 10);
      count--;
      countContainer.text(count);
      if (count === 0) {
        this.toggleRequestVisibilty();
        this.toggleActive();
        this.requestContainer.prepend('<li><span>No Requets : /</span></li>');
      }
    };


    // *************NEEDS ATTENTION***************
    // - should allow for less dupe code in accept/reject
    this.respond = function(destination, data) {

      return (new Promise(function(res, rej) {
        $.post(destination, data).success(function(msg) {
          res(msg);
        }).error(function(err) {
          rej(err);
        });
      }));

    };

    this.getRequestId = function(evt) {
      return $(evt.target).closest('li').attr('request-id');
    };

    this.removeRequestItem = function(evt) {
      $(evt.target).closest('li').remove();
    };

    // *************NEEDS ATTENTION***************
    this.accept = function(evt) {
      var id = this.getRequestId(evt);
      this.respond('/user/acceptRequest', {
        friendId: id
      }).then(function(msg) {
        this.removeRequestItem(evt);
        this.decrement();
      }.bind(this), function(err) {
        console.log(err);
      });
    };

    // *************NEEDS ATTENTION***************
    this.reject = function(evt) {
      var id = this.getRequestId(evt);
      this.respond('/user/removeRequest', {
        friendId: id
      }).then(function(msg) {
        this.removeRequestItem(evt);
        this.decrement();
      }.bind(this), function(err) {
        console.log(err);
      });
    };

    this.toggleActive = function() {
      this.container.children().each(function(index, item) {
        var node = $(item);
        if (node.hasClass('active')) {
          node.removeClass('active');
          node.addClass('inactive');
        } else {
          node.removeClass('inactive');
          node.addClass('active');
        }
      });
    };

    this.toggleRequestVisibilty = function() {
      this.requestContainer.toggleClass('hide');
    };

  }


  function handleSearchSubmit(evt) {
    map.execNearbySearch(searchTextBox.getInput());
  }

  function handleSearchInput(evt) {

    if (evt.keyCode === 13) {
      searchServices.nearbySearch(searchTextBox.getInput(), function(res, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          
          map.clearMarkers(function(marker) {return (marker.setBy === 'SEARCH_SVC') ? true : false})
          map.plotPlaces(res, 'SEARCH_SVC');
                    
        }
      })
      return;
    }

    if (searchTextBox.length() === 0) return prefetchResults.clear();
    if (searchTextBox.length() >= 4) return prefetchResults.fetch(searchTextBox.getInput());


  }


  function handleRequestSubmit(evt) {

    if ((!evt.keyCode) || (evt.keyCode === 13)) {

      var friendUsername = $('.request--input').val();

      if (!friendUsername) return setMessage.setGeneric('#requestStatus', 'No Friend username?');

      userInterface.sendRequest(friendUsername);
    }
  }


  function handleMyPlaceFilter(evt) {
    map.plotMyPlaces();
  }

  function handleFriendPlaceFilter(evt) {
    map.plotFriendPlaces();
  }

  function handleOpenMail(evt) {
    notifications.toggleRequestVisibilty();
  }



  // *************NEEDS ATTENTION***************
  // - generator or use bubbling based on class
  function handleReqAccept(evt) {
    notifications.accept(evt);
  }

  // *************NEEDS ATTENTION***************
  // - generator or use bubbling based on class
  function handleReqReject(evt) {
    notifications.reject(evt);
  }

  function handleRemoveFriend(evt) {
    userInterface.removeFriend($(evt.target).attr('friend-id'));
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

    // *************NEEDS ATTENTION***************
    $(".friend--remove--btn").click(handleRemoveFriend);
    $(".mail--btn.accept").click(handleReqAccept);
    $(".mail--btn.reject").click(handleReqReject);
  }

  initialize();

});
