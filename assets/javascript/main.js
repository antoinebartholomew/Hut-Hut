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

  // Initialize an array for current hotels on page (used for pushing hotel objects to Firebase)
  var currentHotels = [];


  ////////////////////////////
  ////// EVENT HANDLERS //////
  ////////////////////////////

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
      limit : "10"
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
    // Save user name to a variable
    var userName = $("#user-name").val().trim();
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
        && userExists(snapshot, userName)
        && userHasFavorites(snapshot,userName)
        && placeInFavorites(snapshot, userName, userPlace)
        && hotelInFavorites(snapshot, userName, userPlace, clickedHotelId)) {
          // Alert user that the hotel is already in favorites
          // Change modal
          $(".modal-title").text("Already in Favorites")
          $(".modal-body").html(`<p>${clickedHotelObject.name} is already in ${userName}'s ${userPlace} favorites.</p>`);
          $(".modal-footer").html("<button type='button' class='btn btn-primary' data-dismiss='modal'>Okay</button>");
          // Show modal
          $(".modal").modal("show");
        } else {
          // Otherwise add the hotel object to user's favorites
          db.ref("Users/" + userName + "/Favorites/" + userPlace).child(clickedHotelId).set(clickedHotelObject);
          // Alert user that the hotel was added to favorites
          // Change modal
          $(".modal-title").text("Successfully Added")
          $(".modal-body").html(`<p>${clickedHotelObject.name} was added to ${userName}'s ${userPlace} favorites.</p>`);
          $(".modal-footer").html("<button type='button' class='btn btn-primary' data-dismiss='modal'>Okay</button>");
          // Show modal
          $(".modal").modal("show");
        }
      });
    }

    // If the clicked button is trash
    if ($(this).hasClass("btn-trash")) {
      // Grab snapshot of root to work with
      db.ref().once("value").then(function(snapshot) {
        // If appropriate object tree exists and clicked hotel is already in trash
        if (!isDatabaseEmpty(snapshot)
        && usersExist(snapshot)
        && userExists(snapshot, userName)
        && userHasTrash(snapshot, userName)
        && hotelInTrash(snapshot, userName, clickedHotelId)) {
          // Alert user that the hotel is already in their trash
          // Change modal
          $(".modal-title").text("Already in Trash")
          $(".modal-body").html(`<p>${clickedHotelObject.name} is already in ${userName}'s trash.</p>`);
          $(".modal-footer").html("<button type='button' class='btn btn-primary' data-dismiss='modal'>Okay</button>");
          // Show modal
          $(".modal").modal("show");
        } else {
          // Otherwise add the hotel object to user's trash
          db.ref("Users/" + userName + "/Trash").child(clickedHotelId).set(clickedHotelId);
          // Alert user that the hotel was added to their trash
          // Change modal
          $(".modal-title").text("Successfully trashed")
          $(".modal-body").html(`<p>${clickedHotelObject.name} was added to ${userName}'s trash.</p>`);
          $(".modal-footer").html("<button type='button' class='btn btn-primary' data-dismiss='modal'>Okay</button>");
          // Show modal
          $(".modal").modal("show");
        }
      });
    }
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

  // Check if hotel exists in user's favorites within current place when passed root object, user name, place, and hotelId
  var hotelInFavorites = (root, user, place, hotel) => root.child("Users").child(user).child("Favorites").child(place).val().hasOwnProperty(hotel);

  // Check if hotel exists in user's trash when passed root object, user name, and hotelId
  var hotelInTrash = (root, user, hotel) => root.child("Users").child(user).child("Trash").val().hasOwnProperty(hotel);

  // Populate Cards
  function createHotelObjects(data) {

    // Clear previous results
    $(".results").empty();

    // Clear currentHotels array
    currentHotels = [];

    // Save response array to local array
    var hotelArray = data.response.groups[0].items;

    // Loop through each item in the hotel array
    for (i = 0; i < hotelArray.length; i++) {

      // Grab Foursquare hotel object
      var hotel = hotelArray[i].venue;

      // Create imgUrl variable
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

      // Check each key in hotelObject
      $.each(hotelObject, function(index, value) {
        // If value is undefined
        if (value === undefined) {
          // Change value to "Not Available"
          hotelObject[index] = "Not Available";
        }
      });

      // Push hotel object to currentHotels array (global)
      currentHotels.push(hotelObject);

      // Populate card to results div
      $(".results").append(`
        <div class="card result-card">
          <img class="card-img-top result-card-image" src="${hotelObject.image}">
          <div class="card-body result-card-body">
            <h5 class="card-title result-card-title">${hotelObject.name}</h5>
            <p class="card-text result-card-address">Address: ${hotelObject.address}, ${hotelObject.city}, ${hotelObject.state}, ${hotelObject.zip}</p>
            <p class="card-text result-card-rating">Rating: <i class="fas fa-star"></i>&nbsp;${hotelObject.rating}</p>
            <p class="card-text result-card-web">Website: <a href="${hotelObject.website}" class="result-card-web-link" target="_blank">${hotelObject.website}</a></p>
            <p class="card-text result-card-web">Twitter: <a href="https://twitter.com/${hotelObject.twitter}" class="result-card-web-link" target="_blank">${hotelObject.twitter}</a></p>
            <button type="button" class="btn btn-primary btn-card btn-favorite" data-index=${i}><i class="far fa-heart"></i></i></button>
            <button type="button" class="btn btn-danger btn-card btn-trash" data-index=${i}><i class="fas fa-trash"></i></button>
          </div>
        </div>
        `);
    }
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
});
