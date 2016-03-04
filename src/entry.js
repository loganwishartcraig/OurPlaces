$(document).ready(function() {

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

    userInterface = new UserInterface();

    // register global event handlers
    registerHandlers();

  }

  function UserInterface() {

    this.init = function() {
      $.get('/user/getUser').success(function(data) {
        console.log('got user', data);
        this.user = data;
      }.bind(this)).error(function(err) {
        console.log(err);
      }.bind(this));
    };

    this.hasPlace = function(place_id) {
      console.log(place_id, this.user['ownedPlaces'].hasOwnProperty(place_id))
      return this.user['ownedPlaces'].hasOwnProperty(place_id);
    };

    this.init();

  }

  // Holds functions related to using google search services
  // Used to provide a central location for using search services
  function SearchServices(map) {

    // initalize connection with google places + set relevant map
    this.placeServiceConn = new google.maps.places.PlacesService(map);

    // *************NEEDS ATTENTION***************
    // function for building basic search requests
    this.buildSearchRequest = function(keyword) {
      return ({
        location: new google.maps.LatLng(-33.8665, 151.1956),
        radius: '500',
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
    this.template = '<div>{{ACTION_BTN}}<span>{{PLACE_NAME}}</span></div>';

    // set initial 'open' state
    this.open = false;


    // *************NEEDS ATTENTION***************
    this.buildActionBtn = function(place) {
      var btn = '';
      console.log('checking if saved...', userInterface.hasPlace(place.place_id));
      if (userInterface.hasPlace(place.place_id)) {
        btn = '<button class="' + this.classes.remove + '" place_id="' + place.place_id + '">Remove Place</button>';
      } else {
        btn = '<button class="' + this.classes.save + '" place_id="' + place.place_id + '">Save Place</button>';
      }
      return btn;
    };

    // function for formatting the template into useable HTML string
    this.buildInfoWindow = function(place) {

      var btn = this.buildActionBtn(place);

      var contentString = this.template.replace("{{PLACE_ID}}", place.place_id)
        .replace("{{PLACE_NAME}}", place.name)
        .replace("{{ACTION_BTN}}", btn);

      return contentString;

    };

    // *************NEEDS ATTENTION***************
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
      }).error(function(err) {
        // on error, log error
        console.log(err);
      });
    };

    // *************NEEDS ATTENTION***************
    this.removePlace = function(place) {
      console.log('removing! ' + JSON.stringify(place));
      var data = JSON.stringify(place);
      $.post('/user/removePlace', {
        place: data
      }).success(function(msg) {
        // on success, log message
        console.log(msg);
      }).error(function(err) {
        // on error, log error
        console.log(err);
      });
    };

    // *************NEEDS ATTENTION***************
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

    this.generateMarker = function(place) {
      return (new google.maps.Marker({
        map: this.map,
        position: place.geometry.location,
        title: place.name
      }));
    };

    this.placeMarker = function(place) {
      var marker = this.generateMarker(place);
      var infoPane = new infoWindow(this.map, place, marker);
      marker.addListener('click', function() {
        infoPane.toggleOpen();
      });
    }.bind(this);


    this.plotPlaces = function(res, status) {
      console.log(res, status);
      // proceed only if succeeded
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        // make a marker for each result
        for (var i = 0; i < res.length; i++) {
          this.placeMarker(res[i]);
        }
      }
    }.bind(this);

    this.execNearbySearch = function(searchTerm) {
      console.log("executing search");
      searchServices.nearbySearch(searchTerm, this.plotPlaces);
    };

    this.execSearchById = function(placeId) {
      searchServices.placeDetails(placeId, this.placeMarker);
    };

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
      // %

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




  function handleSearchInput(evt) {

    if (evt.keyCode === 13) return map.execNearbySearch(searchTextBox.getInput());

    if (searchTextBox.length() === 0) return prefetchResults.clear();
    if (searchTextBox.length() >= 4) return prefetchResults.fetch(searchTextBox.getInput());


  }



  // registers global event handlers
  function registerHandlers() {
    // search submit button => excecute search
    document.getElementById('placesSearchSubmit').addEventListener('click', function() {
      map.execNearbySearch(searchTextBox.getInput());
    });
    document.getElementById('placeSearchInput').addEventListener('keyup', handleSearchInput);
  }

  // Run the initialize function when the window has finished loading.
  // google.maps.event.addDomListener(window, 'load', initialize);
  initialize();

});
