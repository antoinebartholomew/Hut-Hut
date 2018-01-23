$(document).ready(function() {

  /////////////////////////////////////
  ////// DATABASE INITIALIZATION //////
  /////////////////////////////////////

  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyBuQAxSRUyrkX7Sj6bIvj86bkXszSrVYbg",
    authDomain: "hut-hut-104a9.firebaseapp.com",
    databaseURL: "https://hut-hut-104a9.firebaseio.com",
    projectId: "hut-hut-104a9",
    storageBucket: "hut-hut-104a9.appspot.com",
    messagingSenderId: "293814567034"
  };

  firebase.initializeApp(config);

  var db = firebase.database();


  //////////////////////////////
  ////// GLOBAL VARIABLES //////
  //////////////////////////////

  // Initialize an array for all hotels from Foursquare response
  var allHotels = [];
  // Initialize an array for current hotels on page (used for pushing hotel objects to Firebase)
  var currentHotels = [];
  // Initialize an object to hold all edited hotels in pages (arrays)
  var hotelPages = {};
  // Initialize currentUser variable to be used during user's session
  var currentUser = "";
  // Initialize currentPage variable to be used in handling next and previous pagination buttons
  var currentPage = 0;
  // Initialize a totalPages to be used in handling next and previous pagination buttons
  var totalPages = 0;
  // Initialize userFavorites variable to store user's favorites on log in (for styling cards)
  var userFavoriteIds = [];
  // Initialize userTrash variable to store user's trash on log in (for populating results)
  var userTrashIds = [];
  // GLobal Variable for the Google API for the latitudes and longitudes
  var markers = [];
  // // GLobal Variable for the Google API index of hotel names and ratings
  var infoWindowContent = [];
  var map;



  ////////////////////////////
  ////// EVENT HANDLERS //////
  ////////////////////////////

  // User log in button click
  $(document).on("click", ".btn-user-log-in", function() {
    // Prevent default
    event.preventDefault();
    // Call logIn
    logIn();
    Autocomplete();
  });

  // User search button click
  $(document).on("click", "#hut-submit", function() {

    // Prevent Default
    event.preventDefault();

    // Create category array and category string
    var categoryArray = [];
    var categoryString = "";

    // Add to category array based on checkboxes clicked
    if ($("#cat-btn-bnb").hasClass("active")) {
      categoryArray.push("4bf58dd8d48988d1f8931735");
    }
    if ($("#cat-btn-boarding").hasClass("active")) {
      categoryArray.push("4f4530a74b9074f6e4fb0100");
    }
    if ($("#cat-btn-hostel").hasClass("active")) {
      categoryArray.push("4bf58dd8d48988d1ee931735");
    }
    if ($("#cat-btn-motel").hasClass("active")) {
      categoryArray.push("4bf58dd8d48988d1fb931735");
    }
    if ($("#cat-btn-resort").hasClass("active")) {
      categoryArray.push("4bf58dd8d48988d12f951735");
    }
    if ($("#cat-btn-vacation").hasClass("active")) {
      categoryArray.push("56aa371be4b08b9a8d5734e1");
    }

    // If length of categoryArray is 0 (i.e. no subcategories were clicked)
    if (categoryArray.length === 0) {
      // Set categoryString to hotel super category
      categoryString = "4bf58dd8d48988d1fa931735"
    } else {
      // Otherwise join array to string using commas
      categoryString = categoryArray.join(",");
    }


    // Construct search object
    var userUrlObj = {
      clientId : "GCAZLY2LL451QYZAJHC10LXCRPDRNDGOVDXLOJAB51HYDBGT",
      clientSecret : "XXS1NU0C10PGX0XGTGQZ44PBIFSARMO0MOSXATTEGBRJX1GC",
      urlBase : "https://api.foursquare.com/v2/venues/explore?",
      // near
      userSearch : $("#hut-input").val().trim(),
      // categoryId
      hotelCategory : categoryString,
      // limit
      limit : "50",
    }

    // Construct query URL
    var queryUrl = `${userUrlObj.urlBase}&v=20180113&categoryId=${userUrlObj.hotelCategory}&near=${userUrlObj.userSearch}&limit=${userUrlObj.limit}&venuePhotos=1&client_id=${userUrlObj.clientId}&client_secret=${userUrlObj.clientSecret}`;

    // AJAX Request
    $.ajax({
      url : queryUrl,
      method : "GET"
    })
    // When done, call createHotelObjects function
    .done(createHotelObjects)
    // If request failed, call errorHandler function
    .fail(errorHandler);
  });

  // Favorite / Trash Button Click Handler
  $(document).on("click", ".btn-card", function() {
    // Save user place search to a variable
    var userPlace = $("#hut-input").val().trim();
    // Save the data-index value of the clicked button to a variable
    var clickedIndex = $(this).attr("data-index");
    // Save the corresponding object from the currentHotels array to a variable
    var clickedHotelObject = currentHotels[clickedIndex];
    // Save Foursquare ID for Firebase naming purposes
    var clickedHotelId = clickedHotelObject.id;

    // If the clicked button is favorite
    if ($(this).hasClass("btn-favorite")) {
      // Grab snapshot of root to work with
      db.ref().once("value").then(function(snapshot) {

        // If appropriate object tree exists and clicked hotel is already in user's favorites
        if (!isDatabaseEmpty(snapshot)
        && usersExist(snapshot)
        && userExists(snapshot, currentUser)
        && userHasFavorites(snapshot,currentUser)
        && placeInFavorites(snapshot, currentUser, userPlace)
        && hotelInFavorites(snapshot, currentUser, userPlace, clickedHotelId)) {
          // Alert user that the hotel is already in favorites
          // Change modal
          $(".modal-title").text("Already in Favorites")
          $(".modal-body").html(`<p>${clickedHotelObject.name} is already in ${currentUser}'s ${userPlace} favorites.</p>`);
          $(".modal-footer").html("<button type='button' class='btn btn-primary' data-dismiss='modal'>Okay</button>");
          // Show modal
          $(".modal").modal("show");
        } else {
          // Otherwise add the hotel object to user's favorites
          db.ref("Users/" + currentUser + "/Favorites/" + userPlace).child(clickedHotelId).set(clickedHotelObject);
          // Alert user that the hotel was added to favorites
          // Change modal
          $(".modal-title").text("Successfully Added")
          $(".modal-body").html(`<p>${clickedHotelObject.name} was added to ${currentUser}'s ${userPlace} favorites.</p>`);
          $(".modal-footer").html("<button type='button' class='btn btn-primary' data-dismiss='modal'>Okay</button>");
          // Show modal
          $(".modal").modal("show");
          // Get updated snapshot of user's favorites then call populateFavorites
          db.ref("Users/" + currentUser + "/Favorites/").once("value").then(populateFavorites);
          // Push to userFavoriteIds
          userFavoriteIds.push(clickedHotelId);
          // Populate cards
          populateCards(currentPage);
        }
      });

      populateFavorites();
    }

    // If the clicked button is trash
    if ($(this).hasClass("btn-trash")) {
      // Grab snapshot of root to work with
      db.ref().once("value").then(function(snapshot) {
        // If appropriate object tree exists and clicked hotel is already in trash
        if (!isDatabaseEmpty(snapshot)
        && usersExist(snapshot)
        && userExists(snapshot, currentUser)
        && userHasTrash(snapshot, currentUser)
        && placeInTrash(snapshot, currentUser, userPlace)
        && hotelInTrash(snapshot, currentUser, userPlace, clickedHotelId)) {
          // Alert user that the hotel is already in their trash
          // Change modal
          $(".modal-title").text("Already in Trash")
          $(".modal-body").html(`<p>${clickedHotelObject.name} is already in ${currentUser}'s trash.</p>`);
          $(".modal-footer").html("<button type='button' class='btn btn-primary' data-dismiss='modal'>Okay</button>");
          // Show modal
          $(".modal").modal("show");
        } else {
          // Otherwise add the hotel object to user's Trash
          db.ref("Users/" + currentUser + "/Trash/" + userPlace).child(clickedHotelId).set(clickedHotelObject);
          // Alert user that the hotel was added to Trash
          // Change modal
          $(".modal-title").text("Successfully Added")
          $(".modal-body").html(`<p>${clickedHotelObject.name} was added to ${currentUser}'s ${userPlace} Trash.</p>`);
          $(".modal-footer").html("<button type='button' class='btn btn-primary' data-dismiss='modal'>Okay</button>");
          // Show modal
          $(".modal").modal("show");
          // Get updated snapshot of user's favorites then call populateFavorites
          db.ref("Users/" + currentUser + "/Trash/").once("value").then(populateTrash);
          // Push to userTrashIds
          userTrashIds.push(clickedHotelId);
          // Populate cards
          populateCards(currentPage);
        }
      });

      populateTrash();
    }
  });

  // Pagination link clink handler
  $(document).on("click", ".page-link", function() {
    // Prevent default
    event.preventDefault();
    // Check if it's the previous button
    if ($(this).hasClass("page-link-previous")) {
      var previousPage = currentPage - 1;
      populateCards(previousPage.toString());
    // Check if it's the next button
    } else if ($(this).hasClass("page-link-next")) {
      var nextPage = currentPage + 1;
      populateCards(nextPage.toString());
    } else {
      var clickedPage = $(this).parent().attr("data-page");
      populateCards(clickedPage);
    }
  });

  // User search entry onkeyup handler (allow only letters and spaces)
  $(document).on("keypress", "#hut-input", function(e) {
    var regex = /[^a-z \n\r]/gi;
    var key = String.fromCharCode(!e.charCode ? e.which : e.charCode);
    if (regex.test(key)) {
      e.preventDefault();
      return false;
    }
  });

  // User name entry onkeyup handler (allow only letters, spaces, and numbers)
  $(document).on("keypress", "#user-name", function(e) {
    var regex = /[^a-z0-9 \n\r]/gi;
    var key = String.fromCharCode(!e.charCode ? e.which : e.charCode);
    if (regex.test(key)) {
      e.preventDefault();
      return false;
      // If key is enter, call logIn()
    } else if (e.keyCode === 13) {
      e.preventDefault();
      logIn();
    }
  });

  // Card dropped in favorites handler
  $(".droppable-favorites").droppable({
    tolerance: "pointer",
    drop: function(event, ui) {
      var draggedCard = $(ui.draggable)[0];
      var draggedButton = $(draggedCard).find(".btn-favorite")[0];
      var draggedIndex = $(draggedButton).attr("data-index");
      $(draggedButton).trigger("click");
    }
  });

  // Card dropped in trash handler
  $(".droppable-trash").droppable({
    tolerance: "pointer",
    drop: function(event, ui) {
      var draggedCard = $(ui.draggable)[0];
      var draggedButton = $(draggedCard).find(".btn-trash")[0];
      var draggedIndex = $(draggedButton).attr("data-index");
      $(draggedButton).trigger("click");
    }
  });

  // Undelete hotel button handler
  $(document).on("click", ".btn-undelete", function() {
    // Grab path values from button attributes
    var thisPlace = $(this).attr("place-id");
    var thisHotel = $(this).attr("hotel-id");



    // Fix thisPlace for places with spaces for Firebase
    var thisPlaceArray = thisPlace.split("-");
    if (thisPlaceArray.length > 1) {
      thisPlace = thisPlaceArray.join(" ");
    }

    // Remove the hotel from Firebase trash
    db.ref("Users/" + currentUser + "/Trash/" + thisPlace).child(thisHotel).remove();

    // Call populateTrash
    populateTrash();
  });

  // Unfavorite hotel button handler
  $(document).on("click", ".btn-unfavorite", function() {
    // Grab path values from button attributes
    var thisPlace = $(this).attr("place-id");
    var thisHotel = $(this).attr("hotel-id");

    // Fix thisPlace for places with spaces for Firebase
    var thisPlaceArray = thisPlace.split("-");
    if (thisPlaceArray.length > 1) {
      thisPlace = thisPlaceArray.join(" ");
    }

    // Remove the hotel from Firebase trash
    db.ref("Users/" + currentUser + "/Favorites/" + thisPlace).child(thisHotel).remove();

    // Call populateTrash
    populateFavorites();
  });

  // Force Google Maps resize on tab shown (to prevent gray screen)
  $(document).on("shown.bs.tab", "#nav-tab-map", function() {
    setTimeout(function() {
      // google.maps.event.trigger(map, "resize");
      resetMap(map);
    }, 300);

  });

  function resetMap(m) {
    var mapZoom = m.getZoom();
    var mapCenter = m.getCenter();
    google.maps.event.trigger(m, "resize");
    map.setZoom(mapZoom);
    map.setCenter(mapCenter);
  }

  // Log Out click handler
  $(document).on("click", ".logout-btn", function() {
    // Reload page
    document.location.reload(true);
  });


  ///////////////////////
  ////// FUNCTIONS //////
  ///////////////////////

  // Check if database is empty when passed root object
  var isDatabaseEmpty = (root) => (root.val() === null) ? true : false;

  // Check if "Users" object exists in database when passed root object
  var usersExist = (root) => root.val().hasOwnProperty("Users");

  // Check if user exists in Users object when passed root object and user name
  var userExists = (root, user) => root.child("Users").val().hasOwnProperty(user);

  // Check if Favorites object exists within a user object when passed root object and user name
  var userHasFavorites = (root, user) => root.child("Users").child(user).val().hasOwnProperty("Favorites");

  // Check if Trash object exists within a user object when passed root object and user name
  var userHasTrash = (root, user) => root.child("Users").child(user).val().hasOwnProperty("Trash");

  // Check if a place exists in user's favorites when passed root object, user name, and place
  var placeInFavorites = (root, user, place) => root.child("Users").child(user).child("Favorites").val().hasOwnProperty(place);

  // Check if a place exists in user's trash when passed root object, user name, and place
  var placeInTrash = (root, user, place) => root.child("Users").child(user).child("Trash").val().hasOwnProperty(place);

  // Check if hotel exists in user's favorites within current place when passed root object, user name, place, and hotelId
  var hotelInFavorites = (root, user, place, hotel) => root.child("Users").child(user).child("Favorites").child(place).val().hasOwnProperty(hotel);

  // Check if hotel exists in user's trash when passed root object, user name, and hotelId
  var hotelInTrash = (root, user, place, hotel) => root.child("Users").child(user).child("Trash").child(place).val().hasOwnProperty(hotel);

  // Log in function
  function logIn() {
    // Save user name to global variable
    currentUser = $("#user-name").val().trim();
    // If blank, add a message to modal that tells the user they have to enter something
    if (currentUser.length === 0) {
      $(".modal-form-small-text").text("You must log in to use this app");
    } else {
      // Save user name to user name span in header
      $(".header-user-name").text(currentUser);
      // Show user name in header
      $(".header-main-user").show();
      // Hide modal
      $(".modal").modal("hide");
      // Populate Favorites
      populateFavorites();
      // Populate Trash
      populateTrash();
    }
  }

  // Create hotel objects
  function createHotelObjects(data) {

    // Clear all hotels array
    allHotels = [];

    // Save response array to local array
    var hotelArray = data.response.groups[0].items;

    // Loop through each item in the hotel array
    for (i = 0; i < hotelArray.length; i++) {

      // Grab Foursquare hotel object
      var hotel = hotelArray[i].venue;

      // Create imgURL variable
      var imgURL = "";
      // If no photo exists
      if (hotel.photos.count === 0) {
        // Set imgURL to local no-image-available file
        imgURL = "assets/images/no-image-available.png";
      } else {
        // Otherwise construction the Foursquare image URL
        var imgPrefix = hotel.photos.groups[0].items[0].prefix;
        var imgSize = "200x200";
        var imgSuffix = hotel.photos.groups[0].items[0].suffix;
        imgURL = imgPrefix + imgSize + imgSuffix;
      }

      // Create hotel object with parameters we're interested in
      var hotelObject = {
        id : hotel.id,
        name : hotel.name,
        phone : hotel.contact.phone,
        twitter : hotel.contact.twitter,
        address : hotel.location.address,
        city : hotel.location.city,
        state : hotel.location.state,
        zip : hotel.location.postalCode,
        lat : hotel.location.lat,
        long : hotel.location.lng,
        rating : hotel.rating,
        website : hotel.url,
        image : imgURL
      }

      // Push hotel object to allHotels array (global) if the id is not in the userTrashIds array
      if (!userTrashIds.includes(hotelObject.id)) {
        allHotels.push(hotelObject);
      }
    }

    // Split all hotels array into arrays of 9 (or less for last array) and add to hotelPages object
    // Empty hotelPages
    hotelPages = {};
    var pageCount = 1;
    for (i = 0; i < allHotels.length; i += 9) {
      hotelPages[pageCount] = allHotels.slice(i, i+9);
      pageCount++;
    }

    // Clear pagination div
    $(".search-pagination-section").empty();
    // Create pagination skeleton
    $(".search-pagination-section").append(`
      <nav>
        <ul class="pagination search-pagination">
        </ul>
      </nav>`);

    // Add previous and next buttons
    $(".search-pagination").append(`
        <li class="page-item" data-page="0">
          <a class="page-link page-link-previous" href="#"><span><i class="fas fa-arrow-left"></span></i></a>
        </li>
        <li class="page-item">
          <a class="page-link page-link-next" href="#"><span><i class="fas fa-arrow-right"></i></span></a>
        </li>`);

    // Create index to keep track of last page (need to put pages in order starting after the previous arrow)
    var lastPageIndex = 0;
    // For each key in hotelPages object, add a pagination list item after lastPage
    $.each(hotelPages, function(index, value) {
      // Select previous page list item based on index
      var lastPage = $(`li[data-page=${lastPageIndex.toString()}]`);

      // Place new list item after previous list item
      $(lastPage).after(`
        <li class="page-item" data-page=${index}>
          <a class="page-link" href="#">${index}</a>
        </li>`);

      // Incremenet lastPageIndex
      lastPageIndex++;
    });

    // Reduce 1 from pageCount (because it will have incremented again) and save to totalPages
    totalPages = pageCount - 1;

    // Call populateCards and pass it "1" for first page
    populateCards("1");
  }

  function populateCards(page) {
    // Clear previous results
    $(".results").empty();

    // Fill currentHotels with hotelPages array with key that matches page
    currentHotels = hotelPages[page];

    // Set currentPage to page
    currentPage = parseInt(page);

    // Empty global map arrays
    markers = [];
    infoWindowContent = [];


    // For each hotel in currentHotels, create a card
    for (i = 0; i < currentHotels.length; i++) {
      // Save hotel object to a variable for ease of reference
      var thisHotel = currentHotels[i];


      // If thisHotel's ID is in userFavoriteIds,
      if (userFavoriteIds.includes(thisHotel.id)) {
        var favoriteStatus = "visible";
      } else {
        var favoriteStatus = "hidden";
      }

      // If web links are undefined, hide them via custom class
      var websiteDisplay = "";
      if (thisHotel.website === undefined) {
        websiteDisplay = "hide-me";
      } else {
        websiteDisplay = "show-me";
      }

      var twitterDisplay = "";
      if (thisHotel.twitter === undefined) {
        twitterDisplay = "hide-me";
      } else {
        twitterDisplay = "show-me";
      }

      // If rating is undefined, replace with "No Reviews"
      var ratingDisplay = "";
      if (thisHotel.rating === undefined) {
        ratingDisplay = "No Reviews"
      } else {
        ratingDisplay = `<i class="fas fa-star"></i>&nbsp;${thisHotel.rating}`;
      }

      //Google API objects
      markersObject = {
        name : thisHotel.name,
        lat : thisHotel.lat,
        long : thisHotel.long
      }

      infoWindowContentObject = `
       <div class="info_content">
        <img class="google-map-image" src=${thisHotel.image}>
        <h3 class="name-map">${thisHotel.name}</h3>
        <p class="card-text result-card-rating rating-map">Rating: ${ratingDisplay}</p>
        </div>`

      // Push to markers and infoWindowContentObject array
      markers.push(markersObject);
      infoWindowContent.push(infoWindowContentObject);


      // Populate a card to results div
      $(".results").append(`
        <div class="card result-card draggable col-sm-12 col-md-4">
          <div class="favorite-flag-${favoriteStatus}"><i class="fas fa-heart"></i></div>
          <img class="card-img-top result-card-image" src="${thisHotel.image}">
          <div class="card-body result-card-body">
            <h5 class="card-title result-card-title heavy">${thisHotel.name}</h5>
            <p class="card-text result-card-address">Address: ${thisHotel.address}, ${thisHotel.city}, ${thisHotel.state}, ${thisHotel.zip}</p>
            <p class="card-text result-card-rating">Rating: ${ratingDisplay}</p>
            <p class="card-text result-card-web ${websiteDisplay}"><a href="${thisHotel.website}" class="result-card-web-link" target="_blank">Website</a></p>
            <p class="card-text result-card-web ${twitterDisplay}">Twitter: <a href="https://twitter.com/${thisHotel.twitter}" class="result-card-web-link" target="_blank">${thisHotel.twitter}</a></p>
            <button type="button" class="btn btn-primary btn-card btn-favorite" data-index=${i}><i class="far fa-heart"></i></i></button>
            <button type="button" class="btn btn-danger btn-card btn-trash" data-index=${i}><i class="fas fa-trash"></i></button>
          </div>
        </div>`);

        // Make .draggable class draggable with jQuery UI function
        $(".draggable").draggable({
          revert: true,
          revertDuration: 200
        });
    }

    // If current page is 1, disable previous button
    if (currentPage === 1) {
      $(".page-link-previous").parent().addClass("disabled");
    } else {
      $(".page-link-previous").parent().removeClass("disabled");
    }

    // If current page is the last page, disable next button
    if (currentPage === totalPages) {
      $(".page-link-next").parent().addClass("disabled");
    } else {
      $(".page-link-next").parent().removeClass("disabled");
    }

    initMap(page);
  }

  function errorHandler(error) {
    console.log(error.responseJSON.meta.errorType);
    // Save errorType to a variable
    var err = error.responseJSON.meta.errorType

    // Conditional error messages
    if (err === "quota_exceeded") {
      alert("We're sorry, it appears this application's daily request limit has been reached. Please try again tomorrow.");
    } else if (err === "rate_limit_exceeded") {
      alert("We're sorry, it appears this application's hourly rate limit has been reached. Please try again in an later.");
    } else if (err === "endpoint_error") {
      alert("We're sorry, it appears there is a problem with the application you are using. Please contact the application's creators.");
    } else {
      alert(`We're sorry, we received the error "${err}" from Foursquare. Please ensure your search term is a valid place and contact this application's creators if the problem persists.`);
    }
  }

  function promptUserLogIn() {
    // Change modal
    $(".modal-title").text("Welcome")
    $(".modal-body").html(`
      <p>Please enter your user name to log in to get started.</p>
      <form>
        <div class="form-group modal-form-group">
          <label for="user-name">User Name</label>
          <input type="text" class="form-control" id="user-name" placeholder="Enter Your User Name">
          <small class="form-text modal-form-small-text warning-text"></small>
        </div>
      </form>
      `);
    $(".modal-footer").html("<button type='button' class='btn yellow-btn btn-user-log-in'>Log In</button>");
    // Disallow user from clicking outside modal to close
    $(".modal").modal({backdrop: "static", keyboard: false});
    // Show modal
    $(".modal").modal("show");
  }

  function populateFavorites() {
    // Empty favorites div
    $(".card-favorites-body").empty();
    // Grab snapshot of root to work with
    db.ref().once("value").then(function(snapshot) {
      // If appropriate object tree exists and user has favorites
      if (!isDatabaseEmpty(snapshot)
      && usersExist(snapshot)
      && userExists(snapshot, currentUser)
      && userHasFavorites(snapshot, currentUser)) {
        // Save location of Favorites to a variable
        var userFavorites = snapshot.child("Users").child(currentUser).child("Favorites");

        // Clear userFavoriteIds
        userFavoriteIds = [];

        // Append an accordion div to card-favorites-body
        $(".card-favorites-body").append("<div id='accordion-favorites'></div>");

        // Loop through each location in Favorites
        userFavorites.forEach(function(favorite) {
          // Block to handle if key has spaces
          var currentKey = "";
          var currentKeyArray = favorite.key.split(" ");
          if (currentKeyArray.length > 1) {
            currentKey = currentKeyArray.join("-");
          } else {
            currentKey = favorite.key;
          }
          // Create a collapsible card for each location and append to accordion
          $("#accordion-favorites").append(`
            <div class="card accordion-place-card" id="${currentKey}-accordion-card">
              <div class="card-header accordion-place-header" id="${currentKey}-accordion-place-header">
                <h5 class="mb-0 accordion-place-heading">
                  <button class="btn btn-link collapsed accordion-place-btn" data-toggle="collapse" data-target="#${currentKey}-collapse" aria-expanded="false" aria-controls="${currentKey}-collapse">${favorite.key}</button>
                </h5>
              </div>
              <div id="${currentKey}-collapse" class="collapse" aria-labelledby="${currentKey}-accordion-place-header" data-parent="#accordion-favorites">
                <div class="card-body accordion-place-collapse-body text-center" id="${currentKey}-collapse-body">
                </div>
              </div>
            </div>`);


          // Loop through each hotel in the favorite
          favorite.forEach(function(hotel) {
            // Add id to global userFavoriteIds (for styling cards)
            userFavoriteIds.push(hotel.key)
            // Populate corresponding accordion body with a small image link and name
            $(`#${currentKey}-collapse-body`).append(`
              <a href="${hotel.val().website}" target="_blank" class="hotel-favorites-link"><img class="hotel-favorites-image" src=${hotel.val().image}></a>
              <h6>${hotel.val().name}<h6>
              <button class="btn btn-secondary btn-sm btn-unfavorite" hotel-id="${hotel.val().id}" place-id="${currentKey}">Unfavorite</button>`);
          });
        });
      } else {
        // Add text to Favorites div that says this user does not have any saved Favorites
        $(".card-favorites-body").html(`<p>${currentUser}'s Favorites is empty.</p>`);
      }
    });
  }

  function populateTrash() {
    // Empty trash div
    $(".card-trash-body").empty();
    // Grab snapshot of root to work with
    db.ref().once("value").then(function(snapshot) {
      // If appropriate object tree exists and user has trash
      if (!isDatabaseEmpty(snapshot)
      && usersExist(snapshot)
      && userExists(snapshot, currentUser)
      && userHasTrash(snapshot, currentUser)) {
        // Save location of Trash to a variable
        var userTrash = snapshot.child("Users").child(currentUser).child("Trash");

        // Clear userTrashIds
        userTrashIds = [];

        // Append an accordion div to card-trash-body
        $(".card-trash-body").append("<div id='accordion-trash'></div>");

        // Loop through each location in Trash
        userTrash.forEach(function(trash) {
          // Block to handle if key has spaces
          var currentKey = "";
          var currentKeyArray = trash.key.split(" ");
          if (currentKeyArray.length > 1) {
            currentKey = currentKeyArray.join("-");
          } else {
            currentKey = trash.key;
          }
          // Create a collapsible card for each location and append to accordion
          $("#accordion-trash").append(`
            <div class="card accordion-place-card" id="${currentKey}-accordion-card-trash">
              <div class="card-header accordion-place-header" id="${currentKey}-accordion-place-header-trash">
                <h5 class="mb-0 accordion-place-heading">
                  <button class="btn btn-link collapsed accordion-place-btn" data-toggle="collapse" data-target="#${currentKey}-collapse-trash" aria-expanded="false" aria-controls="${currentKey}-collapse-trash">${trash.key}</button>
                </h5>
              </div>
              <div id="${currentKey}-collapse-trash" class="collapse" aria-labelledby="${currentKey}-accordion-place-header-trash" data-parent="#accordion-trash">
                <div class="card-body accordion-place-collapse-body text-center" id="${currentKey}-collapse-body-trash">
                </div>
              </div>
            </div>`);


          // Loop through each hotel in the trash
          trash.forEach(function(hotel) {
            // Add id to global userTrashIds (for styling cards)
            userTrashIds.push(hotel.key)
            // Populate corresponding accordion body with a small image link and name
            $(`#${currentKey}-collapse-body-trash`).append(`
              <img class="hotel-trash-image" src=${hotel.val().image}>
              <h6>${hotel.val().name}<h6>
              <button class="btn btn-secondary btn-sm btn-undelete" hotel-id="${hotel.val().id}" place-id="${currentKey}">Undelete</button>`);
          });
        });
      } else {
        // Add text to Trash div that says this user does not have any saved trash
        $(".card-trash-body").html(`<p>${currentUser}'s Trash is empty.</p>`);
      }
    });
  }

  function initMap(page) {

    map = undefined;
    var bounds = new google.maps.LatLngBounds();
    var mapOptions = {
      mapTypeId : "roadmap"
    };

    map = new google.maps.Map(document.getElementById("map"), mapOptions);
    map.setTilt(45);

    var infoWindow = new google.maps.InfoWindow(), marker, i;

    for (i = 0; i < markers.length; i++) {


      var position = new google.maps.LatLng(markers[i]["lat"], markers[i]["long"]);
      bounds.extend(position);
      marker = new google.maps.Marker({
        position : position,
        map : map,
        title : markers[i]["name"]
      });

      google.maps.event.addListener(marker, "click", (function(marker, i) {
        return function() {
          infoWindow.setContent(infoWindowContent[i]);
          infoWindow.open(map, marker);
        }
      }) (marker, i));
    }

    map.fitBounds(bounds);

    var boundsListener = google.maps.event.addListener((map), "bounds_changed", function(event) {
      this.setZoom(13);
      google.maps.event.removeListener(boundsListener);
    });
}

Autocomplete
  function Autocomplete() {
    var searchLocation =  document.getElementById("hut-input");
    var opts = {
    types: ['(cities)']
  };

  var autocomplete = new google.maps.places.Autocomplete(searchLocation, opts);
  }

  ////////////////////////////
  ////// FUNCTION CALLS //////
  ////////////////////////////

  // Hide user name section in header
  $(".header-main-user").hide();

  // Call get user function to kick things off
  promptUserLogIn();
});
