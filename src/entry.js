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
        prefetchResults = new PrefetchResults("#placeSearchInput")

        // register global event handlers
        registerHandlers();

    }

    // function for builidng nearby search requests;
    function buildSearchRequest() {

        return ({
            location: new google.maps.LatLng(-33.8665, 151.1956),
            radius: '500',
            keyword: $('#placeSearchInput').val()
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
            return this.textArea.val(); };
        this.isEmpty = () => {
            return (this.textArea.val() === ''); };
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
        this.clear();
        this.toggleLoading();

        resultList.forEach(function(item, index) {
        var toAdd = $("<li></li>");
        toAdd.text(item);
        console.log("adding", toAdd);
        this.resultContainer.append(toAdd);
      });

      };

      this.clear = function() {
        this.resultContainer.children().not('li:first').remove();
      };

      this.toggleLoading = function() {
        this.resultContainer.children('li:first').toggleClass('hide');
        this.loading = !this.loading;
      };
    }


    function setResultsList(selector, resultList) {
      var resultContainer = $(selector);
      resultContainer.children().not('li:first').remove();
      resultContainer.children('li:first').addClass('hide');

      resultList.forEach(function(item, index) {
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
          if ((searchTextBox.isEmpty()) && (!loadingImg.hasClass('hide'))) loadingImg.toggleClass('hide');
          if ((!searchTextBox.isEmpty()) && (loadingImg.hasClass('hide'))) loadingImg.toggleClass('hide');
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
