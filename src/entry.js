$(document).ready(function() {

  // register variables for global access
  var map;
  var placeService;
  var infoWindow;
  var searchTextBox;
  var prefetchResults;


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
    prefetchResults = new PrefetchResults("#predictiveContainer");

    // register global event handlers
    registerHandlers();

  }

  // function for builidng nearby search requests;
  function buildSearchRequest(text) {

    return ({
      location: new google.maps.LatLng(-33.8665, 151.1956),
      radius: '500',
      keyword: text
    });

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
    this.textArea = $(selector);

    this.getInput = () => {
      return this.textArea.val();
    };
    this.isEmpty = () => {
      return (this.textArea.val() === '');
    };
    this.length = () => {
      return (this.textArea.val().length);
    }
  }

  // function to execute the search
  function execNearbySearch() {
    var request = buildSearchRequest();
    placeService.nearbySearch(request, plotPlaces);
  }

  function PrefetchResults(selector) {
    this.resultContainer = $(selector);
    this.loading = false;

    this.set = function(resultList) {
      console.log("setting");

      // %%%%%%%%%%%%%%%%%
      if (resultList.length !== 0) {
        resultList.forEach(function(item, index) {
          var toAdd = $("<li></li>");
          console.log(item);
          toAdd.text(item.name);
          console.log("adding", toAdd);
          this.resultContainer.append(toAdd);
        }.bind(this));
      } else {
        var toAdd = $("<li></li>");
        toAdd.text("No Results :/");
        console.log("adding", toAdd);
        this.resultContainer.append(toAdd);
      }
      // %%%%%%%%%%%%%%%%%

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
      var request = buildSearchRequest(searchTerm);
      console.log("searching ", request);
      placeService.nearbySearch(request, function(data, status) {
        console.log("recieved data", status);
        this.clear();
        this.toggleLoading();
        if (status === google.maps.places.PlacesServiceStatus.OK) return this.set(data);
        if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) return this.set([]);
      }.bind(this));
    };
  }




  function handleSearchInput(evt) {

    if (evt.keyCode === 13) return execNearbySearch();

    if (searchTextBox.length() === 0) return prefetchResults.clear();
    if (searchTextBox.length() >= 4) return prefetchResults.fetch(searchTextBox.getInput());


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
